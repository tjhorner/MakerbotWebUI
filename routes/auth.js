module.exports = function(app, printerConnections) {
  const { User, Printer, Print } = require('../database')(printerConnections)
  const bcrypt = require('bcrypt')

  app.get("/auth/login", (req, res) => {
    if(req.user){
      res.redirect("/")
    }else{
      res.render("auth/login")
    }
  })

  app.post("/auth/login", (req, res) => {
    if(req.user){
      res.redirect("/")
    }else if(req.body){
      User.findOne({
        email: req.body.email
      }, (err, user) => {
        if(!err && user){
          bcrypt.compare(req.body.password, user.passwordHash, (err, valid) => {
            if(valid){
              req.session.userId = user.id
              res.redirect("/prints")
            }else{
              req.flash("error", "The email or password you entered was invalid.")
              res.redirect("/auth/login")
            }
          })
        }else{
          req.flash("error", "The email or password you entered was invalid.")
          res.redirect("/auth/login")
        }
      })
    }else{
      res.redirect("/auth/login")
    }
  })

  app.get("/auth/logout", (req, res) => {
    req.session.userId = undefined
    res.redirect("/")
  })

  app.get("/auth/register", (req, res) => {
    if(req.user){
      res.redirect("/")
    }else{
      res.render("auth/register")
    }
  })

  app.post("/auth/register", (req, res) => {
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
              admin: false
            }, (err, user) => {
              if(err){
                req.flash("error", "Couldn't register for some reason. Check that your email isn't being used.")
                res.redirect("/auth/register")
              }else{
                req.session.userId = user.id
                res.redirect("/prints")
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
  })
}