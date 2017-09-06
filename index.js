require('ejs') // to make bithound happy :)

const config = process.env.MAKERBOT_CONFIG ? JSON.parse(process.env.MAKERBOT_CONFIG) : require('./config.json')

const express = require('express'),
      app = express(),
      expressLayouts = require('express-ejs-layouts'),
      fileUpload = require('express-fileupload'),
      session = require('express-session'),
      flash = require('connect-flash'),
      fs = require('fs'),
      expressMessages = require('express-messages'),
      bodyParser = require('body-parser')

const MakerbotRpc = require('makerbot-rpc')

app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({ secret: config.cookieSecret }))
app.use(flash())
app.use(expressLayouts)
app.use(fileUpload())

app.use(function(req, res, next){
  User.count({ }, (err, count) => {
    if(!err && count === 0 && req.path !== "/setup"){
      res.redirect("/setup")
    }else{
      if(req.session.userId) {
        User.findById(req.session.userId)
          .populate({
            path: "prints",
            populate: {
              path: "printer"
            }
          })
          .exec((err, user) => {
            req.user = user
            res.locals.user = user
            next()
          })
      }else{
        res.locals.user = null
        next()
      }
    }
  })
})

app.use(function (req, res, next) {
  res.locals.messages = expressMessages(req, res)
  next()
})

app.get("/", (req, res) => {
  Print.find({ }).populate("_creator printer").exec((err, prints) => {
    res.render("index", { prints })
  })
})

app.get("/about", (req, res) => {
  res.render("about")
})

var printerConnections = [ ]

const { User, Printer, Print } = require('./database')(printerConnections)

Printer.find({ }, (err, printers) => {
  printers.forEach(printer => {
    printer.connected = false

    printer.save(() => {
      if(!config.debug){
        switch(printer.authType) {
          case "local":
            var printerConn = new MakerbotRpc({
              authMethod: "thingiverse",
              printerIp: printer.ip,
              username: config.printerAuth.username,
              thingiverseToken: config.printerAuth.thingiverseToken
            })
            break
          case "remote":
            var printerConn = new MakerbotRpc({
              authMethod: "reflector",
              printerId: printer.reflectorId,
              accessToken: config.printerAuth.thingiverseToken
            })
            break
        }
        // var printerConn = new MakerbotRpc(printer.ip, config.printerAuth)

        printerConnections.push({
          printer,
          connection: printerConn
        })

        printerConn.on("connected", printerInfo => {
          console.log(`Connected to printer ${printer.id}: ${printerInfo.machine_name}`)
          printer.name = printerInfo.machine_name
          printer.model = printerInfo.bot_type
          printer.save()
        })

        printerConn.on("authenticated", () => {
          console.log(`Authenticated with ${printer.name}`)
          printer.connected = true
          printer.save()
        })

        printerConn.on("state", state => {
          console.log(state.params.info.machine_name, state.params.info.current_process ? state.params.info.current_process.step : "unknown")
          // console.log(state.machine_name, state.current_process ? state.current_process.status : "unknown")
          if(printer.state &&
              printer.state.current_process &&
              printerConn.state.current_process &&
              printer.state.current_process.step !== "completed" &&
              printerConn.state.current_process.step === "completed") {
            console.log("Printer just completed")
            // we just finished a print, mark it as not printing
            Print.find({ printer: printer, printing: true })
              .then(prints => {
                prints.forEach(print => {
                  print.complete = true
                  print.completedAt = new Date()
                  print.printing = false
                  print.save()
                })
              })
          }

          if(printer.state && printerConn.state.current_process === null && printer.state.current_process !== null){
            // we just stopped a print
            printer.state = printerConn.state
            printer.model = printerConn.state.bot_type

            Print.find({ printer: printer, printing: true })
              .then(prints => {
                prints.forEach(print => {
                  print.complete = true
                  print.completedAt = new Date()
                  print.printing = false
                  print.save()
                })
              })

            printer.save(() => {
              Print.find({ printer: null })
                .exec((err, prints) => {
                  prints.forEach(print => print.printIfPrinterAvailable())
                })
            })
          }else{
            printer.state = printerConn.state
            printer.save()
          }
        })
      }
    })
  })
})

setTimeout(() => {
  Print.find({ printer: null })
    .exec((err, prints) => {
      prints.forEach(print => print.printIfPrinterAvailable())
    })
}, 10000)

// Time lapse timer
// Picture taken every 10s
// setInterval(() => {
//   Print.find({ timeLapse: true, printing: true, complete: false })
//     .exec((err, prints) => {
//       prints.forEach(print => print.takeTimeLapseShot())
//     })
// }, 10000)

require('./routes')(app, printerConnections)

app.listen(process.env.PORT || 3000)