const http = require('http');
const fs = require('fs');
const req = http.request('http://localhost:3000/download-secure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Response length:', data.length);
    fs.writeFileSync('test-out.html', data);
  });
});
req.write('apiKey=test_key');
req.end();
