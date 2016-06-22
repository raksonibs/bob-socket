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
  console.log("Getting Articles")
  request('http://localhost:3000/articles?newArticles=true', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body) // Show the HTML for the Google homepage.
      var json = JSON.parse(body)
      
      if (json.data.length > 0) {        
        io.emit('message', "yo, sending articles!")
        io.emit('new_articles',  JSON.parse(body));
      } else {
        io.emit('message', "there are no new articles:(!")
      }
    } else {
      io.emit('error', new Date().toTimeString());
    }
  })
}, 5001);
