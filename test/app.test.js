var { describe, it, before, after } = require('node:test');
var assert = require('node:assert');
var http = require('node:http');
var { createApp } = require('../app');

function request(server, path) {
  return requestWithMethod(server, path, 'GET');
}

function requestWithMethod(server, path, method, headers) {
  return new Promise((resolve, reject) => {
    var address = server.address();
    var req = http.request({
      hostname: 'localhost',
      port: address.port,
      path: path,
      method: method,
      headers: headers || {}
    }, (res) => {
      var body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          json: () => JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('GET /', () => {
  var server;
  var updatedNames;

  before(() => {
    updatedNames = [];
    server = createApp(updatedNames);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('returns 200 status', async () => {
    var res = await request(server, '/');
    assert.strictEqual(res.status, 200);
  });

  it('returns JSON content type', async () => {
    var res = await request(server, '/');
    assert.ok(res.headers['content-type'].includes('application/json'));
  });

  it('returns empty array when no updates', async () => {
    var res = await request(server, '/');
    var data = res.json();
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 0);
  });

  it('returns CORS headers', async () => {
    var res = await request(server, '/');
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
  });
});

describe('GET / with data', () => {
  var server;
  var updatedNames;

  before(() => {
    updatedNames = ['pkg-a', 'pkg-b', 'pkg-c'];
    server = createApp(updatedNames);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('returns package names', async () => {
    var res = await request(server, '/');
    var data = res.json();
    assert.deepStrictEqual(data, ['pkg-a', 'pkg-b', 'pkg-c']);
  });

  it('deduplicates package names', async () => {
    updatedNames.length = 0;
    updatedNames.push('pkg-a', 'pkg-a', 'pkg-b');
    var res = await request(server, '/');
    var data = res.json();
    assert.deepStrictEqual(data, ['pkg-a', 'pkg-b']);
  });

  it('limits to 200 packages', async () => {
    updatedNames.length = 0;
    for (var i = 0; i < 300; i++) {
      updatedNames.push('pkg-' + i);
    }
    var res = await request(server, '/');
    var data = res.json();
    assert.strictEqual(data.length, 200);
    assert.strictEqual(data[0], 'pkg-0');
    assert.strictEqual(data[199], 'pkg-199');
  });
});

describe('GET /recent', () => {
  var server;
  var updatedNames;

  before(() => {
    updatedNames = [];
    server = createApp(updatedNames);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('returns 200 status', async () => {
    var res = await request(server, '/recent');
    assert.strictEqual(res.status, 200);
  });

  it('returns JSON content type', async () => {
    var res = await request(server, '/recent');
    assert.ok(res.headers['content-type'].includes('application/json'));
  });

  it('returns empty array when no updates', async () => {
    var res = await request(server, '/recent');
    var data = res.json();
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 0);
  });

  it('returns CORS headers', async () => {
    var res = await request(server, '/recent');
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
  });
});

describe('GET /recent with data', () => {
  var server;
  var updatedNames;

  before(() => {
    updatedNames = [];
    for (var i = 0; i < 500; i++) {
      updatedNames.push('pkg-' + i);
    }
    server = createApp(updatedNames);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('returns all packages (not limited to 200)', async () => {
    var res = await request(server, '/recent');
    var data = res.json();
    assert.strictEqual(data.length, 500);
  });

  it('deduplicates package names', async () => {
    updatedNames.length = 0;
    updatedNames.push('pkg-a', 'pkg-a', 'pkg-b', 'pkg-b', 'pkg-c');
    var res = await request(server, '/recent');
    var data = res.json();
    assert.deepStrictEqual(data, ['pkg-a', 'pkg-b', 'pkg-c']);
  });
});

describe('Content-Type details', () => {
  var server;

  before(() => {
    server = createApp(['pkg-a']);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('includes charset in Content-Type on /', async () => {
    var res = await request(server, '/');
    assert.ok(res.headers['content-type'].includes('charset'));
  });

  it('includes charset in Content-Type on /recent', async () => {
    var res = await request(server, '/recent');
    assert.ok(res.headers['content-type'].includes('charset'));
  });
});

describe('CORS preflight', () => {
  var server;

  before(() => {
    server = createApp([]);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('responds to OPTIONS with 204', async () => {
    var res = await requestWithMethod(server, '/', 'OPTIONS', {
      'Origin': 'http://example.com',
      'Access-Control-Request-Method': 'GET'
    });
    assert.strictEqual(res.status, 204);
  });

  it('includes CORS headers on OPTIONS', async () => {
    var res = await requestWithMethod(server, '/', 'OPTIONS', {
      'Origin': 'http://example.com',
      'Access-Control-Request-Method': 'GET'
    });
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
  });

  it('includes allowed methods on OPTIONS', async () => {
    var res = await requestWithMethod(server, '/', 'OPTIONS', {
      'Origin': 'http://example.com',
      'Access-Control-Request-Method': 'GET'
    });
    assert.ok(res.headers['access-control-allow-methods']);
    assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
  });
});

describe('404 handling', () => {
  var server;

  before(() => {
    server = createApp([]);
    server.listen(0);
  });

  after(() => {
    server.close();
  });

  it('returns 404 for unknown routes', async () => {
    var res = await request(server, '/unknown');
    assert.strictEqual(res.status, 404);
  });
});
