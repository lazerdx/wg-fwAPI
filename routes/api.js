const models = require('../models');
const wg = require('../lib/wgdaemon.js');
const { check, validationResult } = require('express-validator/check');
const keyAuth = require('./util/auth.js');
var express = require('express');
var router = express.Router();

router.post('/block/:key', keyAuth, [check('client').isString(), check('addr').isIP(), check('reason').isString()], (req, res, next) => {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  }
  else {  
    models.LLog.findById(req.body.addr, (err, entry) => {
      if (err) {
        next(err);
      }

      var logObj = {origin: {service: req.body.client, address: req.ip}, command: 'block', reason: req.body.reason};
      var resReply = 'The ip ' + req.body.addr + ' has been set to be blocked and will be processed shortly.';

      if (entry) {
        entry.state = 'block';
        entry.sync = false;
        entry.logs.push(logObj);
        entry.save(function (err) {
          if (err) {
            next(err);
          }
          else {
            wg();
            res.status(202).send(resReply);
          }      
        });
      }
      else {
        var newLLog = new models.LLog({ _id: req.body.addr, state: 'block', sync: false });
        newLLog.logs.push(logObj);
        newLLog.save(function (err) {
          if (err) {
            next(err);
          }
          else {
            wg();
            res.status(202).send(resReply);
          }    
        });
      }
    });
  }  
});



router.post('/allow/:key', keyAuth, [check('client').isString(), check('addr').isIP(), check('reason').isString()], (req, res, next) => {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  }
  else {  
    models.LLog.findById(req.body.addr, (err, entry) => {
      if (err) {
        next(err);
      }
      
      var logObject = {origin: {service: req.body.client, address: req.ip}, command: 'allow', reason: req.body.reason};
      var resReply = 'The ip ' + req.body.addr + ' has been set to be allowed and will be processed shortly.';

      if (entry) {
        entry.state = 'allow';
        entry.sync = false;
        entry.logs.push(logObject);
        entry.save(function (err) {
          if (err) {
            next(err);
          }
          else {
            wg();
            res.status(202).send(resReply);
          }  
        });
      }
      else {
        var newLLog = new models.LLog({ _id: req.body.addr, state: 'allow', sync: false });
        newLLog.logs.push(logObject);
        newLLog.save(function (err) {
          if (err) {
            next(err);
          }
          else {
            wg();
            res.status(202).send(resReply);
          }  
        });
      }
    }); 
  }
});

module.exports = router;