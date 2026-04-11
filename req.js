fetch('https://snapit-gyk3.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'test', email: 'test@render.com', password: 'password'})
}).then(r => r.json()).then(console.log).catch(console.error);
