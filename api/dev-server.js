import http from 'node:http';
import 'dotenv/config';
import handler from './index.js';

const port = Number(process.env.API_PORT || 3000);

const server = http.createServer((req, res) => {
  handler(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    }
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  });
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
