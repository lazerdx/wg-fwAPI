const logger = require('./lib/logger.js');
const log = logger.parent;
const config = require('config');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const wg = require('./lib/wgdaemon.js');
const routes = require('./routes');

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};
const uri = config.get('Mongo.address');
const port = config.get('HTTPServer.port');

mongoose.connect(uri, options).then(() => {
  log.info('Connection to MongoDB established.');

  app.use(logger.express, bodyParser.urlencoded({ extended: false }));

  app.use('/api', routes.api);
  app.listen(port, () => log.info(`HTTP server listening on port ${port}!`));

  wg();
}).catch((err) => {
  log.error('Could not establish connection to MongoDB, exiting application.');
  throw err;
});