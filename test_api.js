const http = require('http');

function postFrame() {
  const data = JSON.stringify({
    session_id: '1',
    image: 'data:image/jpeg;base64,TEST_IMAGE_DATA_1234567890'
  });

  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/v1/live-stream/frame',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('POST Response:', res.statusCode, body);
      getFrame();
    });
  });

  req.on('error', (e) => console.error('POST Error:', e.message));
  req.write(data);
  req.end();
}

function getFrame() {
  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/v1/live-stream/1/frame',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('GET Response:', res.statusCode, body.substring(0, 150));
    });
  });

  req.on('error', (e) => console.error('GET Error:', e.message));
  req.end();
}

postFrame();
