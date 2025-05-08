const ChangesStream = require('changes-stream');
var https = require('https');

const changes = new ChangesStream({
  db: 'https://replicate.npmjs.com/registry'
});

changes.on('data', function (change) {
  
  change.results.forEach(function (result) {
    var name = result.id
    if(name){
      console.log(name)
      const cacheBuster = Math.floor(Math.random() * 1000000);
      https.get('https://packages.ecosyste.ms/api/v1/registries/npmjs.org/packages/' + name + '/ping?cb=' + cacheBuster, function(res) {
        console.log(`statusCode: ${res.statusCode}`)
      })
    }
  });  

})
