import https from 'https';

const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';
const data = JSON.stringify({
  chat_id: '8206934939',
  text: 'Teste Hermes Atlas (HTTPS Module)'
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
