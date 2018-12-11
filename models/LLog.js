const mongoose = require('mongoose');
const validators = require('mongoose-validators');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  origin: {
    service: String,
    address: {type: String, validate: validators.isIP()}
  },
  date: {type: Date, default: Date.now},
  command: String,
  reason: String
});

const lLogSchema = new Schema({
  _id: {type: String, validate: validators.isIP()}, //this needs to be a valid ip
  lock: { type: String, default: false },
  state: String, //blocked or allowed or whitelisted(?)
  sync: Boolean,
  logs: [LogSchema]
});

module.exports = mongoose.model('lLog', lLogSchema);