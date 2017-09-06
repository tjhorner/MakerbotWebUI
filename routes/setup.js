module.exports = function(app, printerConnections) {
  const { User, Printer, Print } = require('../database')(printerConnections)
  const bcrypt = require('bcrypt')

  app.get("/setup", (req, res) => {
    // only allow setup if there are no users in db
    User.find({ }, (err, users) => {
      if(!err && users.length){
        res.redirect("/")
      }else{
        res.render("setup/index")
      }
    })
  })

  app.post("/setup", (req, res) => {
    // only allow setup if there are no users in db
    User.find({ }, (err, users) => {
      if(!err && users.length){
        res.redirect("/")
      }else{
        // do some validation
        if(req.body && req.body.first_name && req.body.last_name && req.body.email && req.body.password){
          // validate length
          if(req.body.first_name.trim().length > 0
            && req.body.last_name.trim().length > 0
            && req.body.email.trim().length > 3
            && req.body.password.trim().length >= 6){
            // yay
            bcrypt.genSalt((err, salt) => {
              bcrypt.hash(req.body.password.trim(), salt, (err, hash) => {
                User.create({
                  firstName: req.body.first_name.trim(),
                  lastName: req.body.last_name.trim(),
                  email: req.body.email.trim(),
                  passwordHash: hash,
                  passwordSalt: salt,
                  admin: true
                }, (err, user) => {
                  if(err){
                    req.flash("error", "Couldn't register for some reason. Check that your email isn't being used.")
                    res.redirect("/auth/register")
                  }else{
                    req.session.userId = user.id
                    req.flash("success", "Great, your admin account is now registered! To add a printer, press the Add Printer button below.")
                    res.redirect("/printers")
                  }
                })
              })
            })
          }else{
            // TODO better errors
            req.flash("error", "One of the fields was incorrect. Note that passwords must be at least 6 chars.")
            res.redirect("/auth/register")
          }
        }else{
          req.flash("error", "Please fill out all fields.")
          res.redirect("/auth/register")
        }
      }
    })
  })
}