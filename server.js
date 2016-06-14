// 'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var request = require('request');

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

setInterval(() => {
  request('http://localhost:3000/api/articles', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body) // Show the HTML for the Google homepage.
      io.emit('time', JSON.parse(body));
    } else {
      io.emit('error', new Date().toTimeString());
    }
  })
}, 10000);


// var WebSocketServer = require('ws').Server;  
// var ws = new WebSocketServer({port: 3001});

// // ws.on('connection', function connection(ws) {  
// //   ws.on('message', function incoming(message) {
// //     console.log('received: %s', message);
// //   });

// //   ws.send('Hey! Welcome to my websocket challenge!');
// // });