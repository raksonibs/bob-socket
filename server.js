// 'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var request = require('request');
const debug = require('debug');

debug('booting %s', 'test');

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

  socket.on('turnChange', function(data) {
    // only want to update based on match id
    console.log('need to update change')
    console.log(data)
    // might want to grab match?
    request.patch({url: 'http://localhost:3000/matches/' + data.data.match_id, data: data}, function(error, response, body) {
      // search for match, if cannot find match keep searching, if can find match send data back to transitionTo the new match in the component!
      // need to find those guys like match 3 when match 4 finds to emit to transition back or something
      // set up listener on client that looks for these match ids then?
      console.log(body)
      var json = JSON.parse(body);
      io.emit('updateCurrentTurn', json)
    })
  })

  socket.on('winnerMatch', function(data) {
    console.log(data);
    console.log("recording winner for match id" + data.data.match.id + " and winner is " + data.data.user_id);
    
  })

  socket.on('searchForGame', function(data) {
    console.log(data)
    console.log("searching on server for game type " + data.data.game_type_id + " with game id " + data.data.game_id)
    request('http://localhost:3000/matches/search/' + data.data.game_type_id + "?game_id=" + data.data.game_id, function(error, response, body) {
      // search for match, if cannot find match keep searching, if can find match send data back to transitionTo the new match in the component!
      // need to find those guys like match 3 when match 4 finds to emit to transition back or something
      // set up listener on client that looks for these match ids then?
      console.log(body)
      var json = JSON.parse(body);
      
      if (json["status"] === 428) {        
        console.log("no match data");
        // need to set up listener I think?
        // do I have to set up a dummy match to fill?
      }
      else if (json.data !== null) {
        console.log('we found a match and now need to transition to it!')
        console.log(json)
        io.emit('message', 'found a match!');
        io.emit('found', json)
      } 
    })
  })
});
