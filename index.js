var ChangesStream = require('@npmcorp/changes-stream');
var Redis = require("ioredis");
var redis = new Redis(process.env.REDIS_URL);
var express = require('express');
var cors = require('cors');
var app = express();

var changes = new ChangesStream({
  db: 'https://replicate.npmjs.com/_changes',
  include_docs: true,
  since: 'now',
  inactivity_ms: 60 * 1000
});

changes.on('data', function (change) {
  var name = change.doc.name
  if(name){
    console.log(name)
    redis.lpush('npm-updated-names', name)
  }
})

app.get('/', function (req, res) {
  redis.lrange('npm-updated-names', 0, 200, function (err, replies) {
    res.json([...new Set(replies)]);
  });
})

app.get('/recent', function (req, res) {
  redis.lrange('npm-updated-names', 0, 5000, function (err, replies) {
    res.json([...new Set(replies)]);
  });
})

var port = process.env.PORT || 5001;
app.listen(port, function() {
  console.log('Listening on', port);
});
