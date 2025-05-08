var Redis = require("ioredis");
var redis = new Redis(process.env.REDIS_URL);
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());

(async () => {
  const info = await fetch("https://replicate.npmjs.com/", {
    headers: { 'npm-replication-opt-in': 'true' }
  }).then(res => res.json())

  let since = info.update_seq.toString()
  console.log("since", since)
  const limit = (100).toString()

  while (true) {
    const changes = await fetch(`https://replicate.npmjs.com/_changes?since=${since}&limit=${limit}`, {
      headers: { 'npm-replication-opt-in': 'true' }
    }).then(res => res.json())

    for (const change of changes.results) {
      if (change.deleted) continue

      const name = change.id
      if (name) {
        console.log(name)
        redis.lpush('npm-updated-names', name)
      }
    }

    if (changes.results.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // wait 5 seconds
    }

    since = changes.last_seq.toString()
  }
})()

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
