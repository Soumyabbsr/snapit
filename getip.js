const os = require('os');
const fs = require('fs');

const ifaces = os.networkInterfaces();
let ip = '';

Object.keys(ifaces).forEach(name => {
  ifaces[name].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      ip = iface.address;
    }
  });
});

fs.writeFileSync('C:\\Users\\soumy\\OneDrive\\Desktop\\snapit\\real_ip.txt', ip);
console.log('Saved IP: ' + ip);
