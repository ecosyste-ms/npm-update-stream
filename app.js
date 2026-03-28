var http = require('node:http');

function createApp(updatedNames) {
  var server = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      if (req.headers['access-control-request-headers']) {
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      }
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/') {
      var body = JSON.stringify([...new Set(updatedNames.slice(0, 200))]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(body);
      return;
    }

    if (req.method === 'GET' && req.url === '/recent') {
      var body = JSON.stringify([...new Set(updatedNames)]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(body);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return server;
}

module.exports = { createApp };
