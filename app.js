var express = require('express');
var cors = require('cors');

function createApp(updatedNames) {
  var app = express();
  app.use(cors());

  app.get('/', function (req, res) {
    res.json([...new Set(updatedNames.slice(0, 200))]);
  });

  app.get('/recent', function (req, res) {
    res.json([...new Set(updatedNames)]);
  });

  return app;
}

module.exports = { createApp };
