import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + '/public'));

server.listen(8080, () => {
  console.log('Ready at http://localhost:8080');
});
