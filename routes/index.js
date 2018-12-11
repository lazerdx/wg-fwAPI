const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

var routes = {};
fs
  .readdirSync(__dirname).filter(fileName => {
    return (fileName.indexOf('.') !== 0) && (fileName !== basename) && (fileName.slice(-3) === '.js');
  })
  .forEach(fileName => {
    const route = require(path.join(__dirname, fileName));
    fileName = fileName.split('.')[0];
    routes[fileName] = route;  
  });

module.exports = routes;