const config = require('config');
const loglevel = config.get('Logging.level');
const pino = require('pino');
const parentLogger = pino({level: loglevel});
const expressLogger = require('express-pino-logger')({
  logger: parentLogger
});

module.exports = {
  express: expressLogger,
  parent: parentLogger,
  child: (mod) => {
    return parentLogger.child({module: mod});
  }
};