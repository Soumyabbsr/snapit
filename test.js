const https = require('https');

const data = JSON.stringify({
  name: 'Test2',
  email: 'test2@test.com',
  password: 'password123'
});

const options = {
  hostname: 'snapit-gyk3.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    require('fs').writeFileSync('r.txt', `STATUS: ${res.statusCode}
BODY:
${body}`);
  });
});

req.on('error', error => {
  require('fs').writeFileSync('r.txt', 'ERROR: ' + error.toString());
});

req.write(data);
req.end();
