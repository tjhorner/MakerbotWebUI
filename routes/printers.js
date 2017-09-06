module.exports = function(app, printerConnections) {
  const { User, Printer, Print } = require('../database')(printerConnections)

  app.get("/printers", (req, res) => {
    if(!req.user || req.user && !req.user.admin){
      res.redirect("/")
    }else{
      Printer.find({ }, (err, printers) => {
        res.render("printers/index", { printers })
      })
    }
  })

  app.get("/printers/new", (req, res) => {
    if(!req.user || req.user && !req.user.admin){
      res.redirect("/")
    }else{
      res.render("printers/new")
    }
  })

  app.post("/printers/new", (req, res) => {
    if(!req.user || req.user && !req.user.admin){
      res.redirect("/")
    }else{
      Printer.create({
        authType: req.body.authtype,
        reflectorId: req.body.reflectorid,
        ip: req.body.ip,
        connected: false
      }, (err, printer) => {
        req.flash("success", "Printer added. Once you're done adding printers, restart the server to connect to them.")
        res.redirect("/printers")
      })
    }
  })

  app.get("/printers/:id", (req, res) => {
    if(!req.user || req.user && !req.user.admin){
      res.redirect("/")
    }else{
      Printer.findById(req.params.id, (err, printer) => {
        res.render("printers/view", { printer })
      })
    }
  })

  app.get("/printers/:id/camera.jpg", (req, res) => {
    var printers = printerConnections.filter(conn => (conn.printer.connected && conn.printer.id === req.params.id))

    if(printers.length) {
      var printer = printers[0].connection
      printer.getSingleCameraFrame()
        .then(frame => {
          res.setHeader("Content-Type", "image/jpeg")
          res.send(frame)
        })
    } else {
      res.sendStatus(400)
    }
  })
}