var ChangesStream = require('@npmcorp/changes-stream');
var https = require('https');

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
    https.get('https://packages.ecosyste.ms/api/v1/registries/npmjs.org/packages/'+ name +'/ping', function(res) {
      console.log(`statusCode: ${res.statusCode}`)
    })
  }
})
