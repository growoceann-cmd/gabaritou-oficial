import fetch from 'node-fetch';

async function test() {
  const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';
  const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await r.json();
  console.log(data);
}

test();
