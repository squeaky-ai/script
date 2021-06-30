import http from 'http';
import express from 'express';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + '/public'));

const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(message);
  });

  ws.on('close', () => {
    console.log('Closed')
  });
});

server.listen(5000, () => {
  console.log('Ready at http://localhost:5000');
});
