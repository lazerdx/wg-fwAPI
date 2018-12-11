const logger = require('./logger.js');
const log = logger.child('DAEMON');
const EventEmitter = require('events');
const wg = require('./wgssh.js');
const models = require('../models');

class Daemon extends EventEmitter {}
const daemon = new Daemon();

var active = false;
var keepalive = 0;

module.exports = () => {
  log.info('wgdaemon called, activity value: ', active);
  if (active == true) {
    log.info('already active, incrementing keepalive.');
    keepalive += 1;
    return false;
  }
  else {
    daemon.emit('request');
    return true;
  }
};

daemon.on('request', () => {
  log.info('not active, beginning operation.');
  active = true;
  log.debug('activity value set - ', active);
  models.LLog.find({sync: false}, (err, lLogs) => {
    log.debug('callback for LLog find operation:', lLogs);
    if (err) {
      log.error('Something went wrong accessing the database. Mongo error: ', err);
      keepaliveCheck();
    }
    else if (lLogs.length > 0) {
      log.debug('found some llogs, assigning command value to first llogs entry');
      if (lLogs[0].lock == 'false') {
        var command = lLogs[0].state;
        log.debug('command value: ', command);
        log.debug('llogs id value: ', lLogs[0].id);
        wg(command, lLogs[0].id).then((res) => {
          log.debug('ran wg connection, callback issued ', res);
          syncTrue(lLogs[0]);
          keepaliveCheck();
        }).catch((err) => {
          log.debug('ran wg connection, callback issued ', err);
          syncTrue(lLogs[0]);
          keepaliveCheck();
        });
      }
      else {        
        log.debug('llog is locked, checking keepalive');
        syncTrue(lLogs[0]);        
        keepaliveCheck();
      }
    }
    else if (lLogs.length == 0) {
      log.debug('found no unsynced llogs, checking keepalive.');
      keepaliveCheck();
    }
  });
});

function keepaliveCheck () {
  if (keepalive > 0) {
    log.debug('keepalive in play, removing from keepalive. value: ', keepalive);
    keepalive -= 1;
    log.info('running request() again. keepalive value: ', keepalive);
    daemon.emit('request');
  }
  else {
    log.debug('keepalive is 0, changing activity value. keepalive value: ', keepalive);
    active = false;
    log.debug('activity value: ', active);
  }
}

function syncTrue (obj) {
  obj.sync = true;
  log.debug('set llog sync value: ', obj.sync);
  obj.save();
}
