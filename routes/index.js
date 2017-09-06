module.exports = function(app, printerConnections) {
  require('./printers')(app, printerConnections)
  require('./prints')(app, printerConnections)
  require('./setup')(app, printerConnections)
  require('./auth')(app, printerConnections)
}