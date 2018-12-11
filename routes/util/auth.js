const config = require('config');

module.exports = (req, res, next) => {
  console.log(req.params);
  if (config.has('Secrets.apiKey')) {
    if (config.get('Secrets.apiKey') == req.params.key) {
      next();
    }
    else {
      res.status(401).send('Invalid auth key.');
    }
  }
  else {
    res.status(401).send('Invalid auth key.');
  }
};