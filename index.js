var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());

var updatedNames = [];

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
        updatedNames.unshift(name)
        if (updatedNames.length > 5000) {
          updatedNames = updatedNames.slice(0, 5000)
        }
      }
    }

    if (changes.results.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // wait 5 seconds
    }

    since = changes.last_seq.toString()
  }
})()

app.get('/', function (req, res) {
  res.json([...new Set(updatedNames.slice(0, 200))]);
})

app.get('/recent', function (req, res) {
  res.json([...new Set(updatedNames)]);
})

var port = process.env.PORT || 5001;
app.listen(port, function() {
  console.log('Listening on', port);
});
