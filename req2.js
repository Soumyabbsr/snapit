const fs = require('fs');

fetch('https://snapit-gyk3.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'test2', email: 'test2@render.com', password: 'password789'})
})
.then(r => r.json())
.then(data => fs.writeFileSync('req_out.txt', JSON.stringify(data, null, 2)))
.catch(err => fs.writeFileSync('req_out.txt', 'ERROR: ' + err.toString()));
