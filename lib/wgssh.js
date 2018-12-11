const logger = require('./logger.js');
const log = logger.child('WG');
const config = require('config');
const ipRegex = require('ip-regex');
const Client = require('ssh2').Client;
const commands = {
  show: 'show ip blocked-site ',
  block: 'ip blocked-site host ',
  allow: 'no ip blocked-site host '
};
const importedBlacklist = require('../config/whitelist.js');
const defaultBlacklist = [
  /0\.0\.0\.0/,
  /8\.8\.8\.8/,
  /4\.4\.4\.4/,
  /localhost/,
  /127\.0\.0\.1/,
];

const blacklist = defaultBlacklist.concat(importedBlacklist)

module.exports = function(command, ip) {
  return new Promise((resolve, reject) => {
    if (!command || typeof command === 'undefined') {
      reject(new Error('No command specified.'));
    }
    else if (!ip || typeof ip === 'undefined') {
      ip = '';
    }
    else if (commands.hasOwnProperty(command) == false) {
      reject(new Error('Must specify command: "show", "block", or "allow"'));
    }
    else if (command == 'block' || command == 'allow') {
      if (ipRegex().test(ip) == false) {
        reject(new Error('An incorrect ip was supplied with command.'));
      }
      else {
        for (var i = 0; i < blacklist.length; i++) {
          if (ip.search(blacklist[i]) > -1) {
            reject(new Error('An incorrect ip was supplied with command.'));
          }
        }
      }
    }
    else if (command == 'show' && ip) {
      reject(new Error('The command "show" does not require an ip argument.'));
    }
    cmd = commands[command] + ip + '\n';
    var stdout = '';
    var wgError = {};
  
    var conn = new Client();
    conn.on('ready', function() {
      log.info('WG Client :: ready');
      conn.shell(function(err, stream) {
        if (err) reject(err);
        stream.on('close', function() {
          log.info('WG Stream :: close');
          conn.end();
        }).on('data', function(data) {
          stdout += data.toString();
        }).stderr.on('data', function(data) {
          log.error('STDERR: ' + data);
        });
        stream.end('config\n'+cmd+'exit\nexit\n');
      });
    }).on('end', function() {
      log.info('Client :: disconnected');
      var str = stdout.toString();
      if (str.includes('Error')) {
        var arr = str.substr(str.search(/Error/)).replace(/\"/g, '').substr(7).split(/\.[ \n\r]/);
        wgError.type = arr.shift();
        for(var i = 0; i < arr.length; i++){ 
          if (arr[i].includes('\n') || arr[i].includes('\\n')) {
            arr.splice(i, 1); 
          }
        }
        wgError.body = arr;
        if (wgError.type == 'Login failed') {
          wgError.activeUser = wgError.body[0].match(/\'[^\']*\'/).toString('utf8').replace(/\'/g, '');
        }
        reject(new Error(wgError.type + ' ' + wgError.body + ' ' + wgError.activeUser));
      }
      else if (command == 'show') {
        var ipstr = str.slice(str.search(/Duration for Auto-Blocked Sites/), str.search(/Blocked-Site Exception IP Address\(es\)/));
        var ips = ipstr.match(ipRegex());
        log.debug('str\n', str+'\n');
        log.debug('clipped\n', ipstr+'\n');
        log.debug('return\n', ips+'\n');
        resolve(ips);
      }
      else if (command == 'block') {
        resolve('IP (supposedly) blocked.');
      }
      else if (command == 'allow') {
        resolve('IP (supposedly) unblocked.');
      }   
    }).connect({
      host: config.get("SSH.address"),
      port: config.get("SSH.port"),
      username: config.get("SSH.username"),
      password: config.get("SSH.password")
    });
  });
};