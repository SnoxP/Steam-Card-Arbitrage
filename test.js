const http = require('http');
async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId: "508900" })
  });
  console.log(await res.text());
}
test();
