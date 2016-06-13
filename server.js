// 'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3001;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
  socket.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

// var WebSocketServer = require('ws').Server;  
// var ws = new WebSocketServer({port: 3001});

// // ws.on('connection', function connection(ws) {  
// //   ws.on('message', function incoming(message) {
// //     console.log('received: %s', message);
// //   });

// //   ws.send('Hey! Welcome to my websocket challenge!');
// // });