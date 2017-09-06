const config = process.env.MAKERBOT_CONFIG ? JSON.parse(process.env.MAKERBOT_CONFIG) : require('../config.json')
const moment = require('moment')

var printerConnections = [ ]

const mongoose = require('mongoose')
const fs = require('fs')

const ObjectId = mongoose.Schema.Types.ObjectId

mongoose.connect(config.mongoUri)

// User //

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true },
  admin: { type: Boolean, default: false },
  passwordHash: String,
  passwordSalt: String,
  prints: [{ type: ObjectId, ref: "Print" }]
})

UserSchema.methods.getPrints = function(callback) {
  Print.find({ userId: this.id }, callback)
}

const User = mongoose.model("User", UserSchema)

// Printer //

const PrinterSchema = new mongoose.Schema({
  name: String,
  authType: String, // local | remote
  ip: String, // set if local
  reflectorId: String, // set if remote
  state: Object,
  model: String,
  connected: Boolean
})

const Printer = mongoose.model("Printer", PrinterSchema)

// Print //

const PrintSchema = new mongoose.Schema({
  _creator: { type: ObjectId, ref: "User" },
  name: String,
  printerModel: String,
  printer: { type: ObjectId, ref: "Printer" },
  complete: Boolean,
  wasCancelled: Boolean,
  printing: Boolean,
  timeLapse: Boolean,
  estimatedTime: Number,
  startedAt: Date,
  completedAt: Date
})

PrintSchema.methods.status = function() {
  if(this.complete && this.wasCancelled) {
    return {
      class: "error",
      text: "Cancelled"
    }
  }

  if(this.complete) {
    return {
      class: "complete",
      text: "Printed"
    }
  }

  if(this.printer && this.printer.state && this.printer.state.current_process){
    var currProcess = this.printer.state.current_process

    switch(currProcess.step){
      case "initial_heating":
      case "final_heating":
        return {
          class: "printing",
          text: `Heating &mdash; ${currProcess.progress}%`
        }
        break
      case "homing":
        return {
          class: "printing",
          text: `Homing &mdash; ${currProcess.progress}%`
        }
        break
      case "printing":
        return {
          class: "printing",
          text: `${currProcess.progress}% &mdash; ${moment.duration(currProcess.time_estimation - currProcess.elapsed_time, "seconds").humanize()} left`
        }
        break
      case "completed":
        return {
          class: "complete",
          text: "Complete"
        }
        break
      case "cleaning_up":
        return {
          class: "complete",
          text: "Cleaning Up"
        }
        break
      default:
        return {
          class: "printing",
          text: `Unknown &mdash; ${currProcess.progress}%`
        }
        break
    }
  }else{
    return {
      class: "queued",
      text: "Waiting In Queue"
    }
  }
}

PrintSchema.methods.timeLeft = function() {
  if(this.printer && this.printer.state && this.printer.state.current_process){
    var currProcess = this.printer.state.current_process

    if(currProcess.step === "printing"){
      return currProcess.time_estimation - currProcess.elapsed_time
    }else if(currProcess.step === "complete"){
      return 0
    }else{
      return this.estimatedTime // est. time in seconds is stored in the db when the user uploads
    }
  }else{
    return 0
  }
}

PrintSchema.methods.getPrinterConnection = function() {
  var printers = printerConnections.filter(conn => (conn.printer.connected && conn.printer.id.toString() === this.printer.toString()))
  return printers[0] ? printers[0].connection : undefined
}

PrintSchema.methods.takeTimeLapseShot = function() {
  var self = this
  var printers = printerConnections.filter(conn => (conn.printer.connected && conn.printer.id.toString() === self.printer.toString()))

  if(printers.length) {
    printers[0].connection.getSingleCameraFrame()
      .then(frame => {
        fs.exists(`tmp/timelapses/${this.id}`, exists => {
          if(!exists) fs.mkdirSync(`tmp/timelapses/${this.id}`)
          fs.writeFile(`tmp/timelapses/${this.id}/${new Date().getTime()}.jpg`, frame)
        })
      })
  }
}

PrintSchema.methods.printIfPrinterAvailable = function() {
  var self = this
  return new Promise((resolve, reject) => {
    // get all printers
    Printer.find({ }, (err, printers) => {
      // filter out printers that don't have a current process
      // and is compatible with this print file
      var availablePrinters = printers.filter(printer => (printer.connected && printer.model === self.printerModel && !printer.state.current_process))
      
      // if we have an open printer...
      if(availablePrinters.length){
        var printer = availablePrinters[0]

        // check if we have a connection to that printer
        printerConnections.forEach(conn => {
          // then print to it
          if(conn.printer.id === printer.id)
            conn.connection.printFile(__dirname + "/../tmp/" + self._id + ".makerbot")
        })

        self.printer = printer
        self.startedAt = new Date()
        self.printing = true
        self.save()
      }
    })
  })
}

const Print = mongoose.model("Print", PrintSchema)

module.exports = function(printerConns) {
  // there must be a better way to do this
  printerConnections = printerConns
  return { User, Printer, Print }
}