const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

var models = {};
fs
  .readdirSync(__dirname).filter(fileName => {
    return (fileName.indexOf('.') !== 0) && (fileName !== basename) && (fileName.slice(-3) === '.js');
  })
  .forEach(fileName => {
    const model = require(path.join(__dirname, fileName));
    fileName = fileName.split('.')[0];
    models[fileName] = model;  
  });

module.exports = models;