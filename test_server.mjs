import http from 'http';
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log('\n--- BROWSER ERROR CAUGHT ---');
    console.log(body);
    console.log('----------------------------\n');
    res.end('ok');
  });
}).listen(5174, () => console.log('Listening for browser errors on 5174...'));
