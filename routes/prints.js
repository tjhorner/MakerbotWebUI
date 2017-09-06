const makerbotFileParser = require("../lib/makerbot-file-parser")
const streamifier = require('streamifier')
const fs = require('fs')
const moment = require('moment')

module.exports = function(app, printerConnections) {
  const { User, Print, Printer } = require('../database')(printerConnections)

  app.get("/prints", (req, res) => {
    if(req.user) {
      Print.find({ complete: false }).populate("_creator printer").exec((err, prints) => {
        var timeLeft = 0
        prints.forEach(print => timeLeft += print.timeLeft())
        res.render("prints/index", {
          userPrints: req.user.prints,
          timeLeft: `${prints.filter(print => print.printer).length} prints; ${moment.duration(timeLeft, "seconds").humanize()} left`,
          prints
        })
      })
    }else{
      res.redirect("/")
    }
  })

  app.get("/prints/new", (req, res) => {
    res.render("prints/new")
  })

  app.post("/prints/new", (req, res) => {
    // console.log(req.files.file)
    makerbotFileParser.parse(streamifier.createReadStream(req.files.file.data))
      .then(file => {
        // console.log(file.meta.material)
        Print.create({
          _creator: req.user.id,
          name: req.files.file.name.slice(0, -9),
          printing: false,
          complete: false,
          timeLapse: true,
          printerModel: file.meta.bot_type,
          estimatedTime: file.meta.duration_s
        }, (err, print) => {
          fs.writeFile(__dirname + "/../tmp/" + print._id + ".makerbot", req.files.file.data, err => {
            print.printIfPrinterAvailable()
            req.user.prints.push(print)
            req.user.save(() => {
              req.flash("success", "Print added successfully!")
              res.redirect("/prints")
            })
          })
        })
      })
      .catch(err => {
        console.log(err)
        req.flash("error", "Couldn't add print, try again later.")
        res.redirect("/prints")
      })
  })

  app.get("/prints/:id", (req, res) => {
    Print.findById(req.params.id, (err, print) => {
      res.render("prints/view", { print })
    })
  })

  app.get("/prints/:id/cancel", (req, res) => {
    if(req.user) {
      Print.findById(req.params.id, (err, print) => {
        if(print.printing && print._creator.toString() === req.user.id.toString()) {
          var conn = print.getPrinterConnection()
          if(conn) {
            conn.cancel()

            print.complete = true
            print.printing = false
            print.completedAt = new Date()
            print.save()
          }
          
          res.redirect("/prints")
        } else {
          res.redirect("/prints")
        }
      })
    } else {
      res.redirect("/")
    }
  })

  // app.get("/prints/:id/start", (req, res) => {
  //   Print.findById(req.params.id, (err, print) => {
  //     print.printIfPrinterAvailable()
  //     req.flash("success", "Print has been started")
  //     res.redirect(`/prints/${print.id}`)
  //   })
  // })
}