// 'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var request = require('request');
const debug = require('debug');
var json;

debug('booting %s', 'test');

function jsonParse(body) {
  var json;

  try {
    json = JSON.parse(body);
  } catch (e)  {
    json = body;
  }

  return json;
}

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

  socket.on('resetMover', function(data) {
    console.log("RESETING MOVER DATA IN RAILS APP");
    request.patch({url: "http://localhost:3000/movers/" + data.data.mover_id + "/reset"}, function(error, response, body) {
      console.log(body)
      json = jsonParse(body);
      // io.emit('updateCurrentTurn', json)
    })
  })

  socket.on('turnChange', function(data) {
    // only want to update based on match id
    console.log('need to update change')
    console.log(data)
    // might want to grab match?
    request.patch({url: 'http://localhost:3000/matches/' + data.data.match.uniqueId, data: data}, function(error, response, body) {
      console.log("HERE IS THE TURN CHANGE JSON");
      console.log(body)
      json = jsonParse(body);
      io.emit('updateCurrentTurn', json)
    })
  })

  socket.on('recordMove', function(data) {
    console.log('MOVE RECORDED!');
    // console.log(data);
    json = jsonParse(data);
    console.log("PARSED CHOICE< DIFFERENT FOR TTT AND STIXX");
    console.log(json);
    // problem here is the post request doesn't actually pass the data, and can't pass data as option or something...
    var choice;

    if (typeof json.data.choice === 'object') {
      console.log("CLEANING CHOICE");
      choice = [json.data.choice.row, json.data.choice.col];
    } else {
      choice = choice;
    }
    request.post({url: "http://localhost:3000/matches/" + data.data.match.uniqueId +"/record_move?choice=" + choice + "&user=" + data.data.user_id, data: json}, function(error, response, body) {
      console.log(body)
      json = jsonParse(body);

      if (json["status"] === 428) {        
        console.log("no mover data");
        // need to set up listener I think?
        // do I have to set up a dummy match to fill?
      }
      else if (json.data !== null) {
        console.log("MOVE RECORDED< HERE IS THE RESPONSE FROM POST RECORD");
        console.log(json);
        io.emit('moveRecorded', json);
      }

    })
  })

  socket.on('winnerMatch', function(data) {
    console.log(data);
    console.log("recording winner for match id" + data.data.match.uniqueId + " and winner is " + data.data.user_id);
    request.post({url: "http://localhost:3000/matches/" + data.data.match.uniqueId + "/winner/?user_id=" + data.data.user_id, data: data}, function(error, response, body) {
      console.log(body)
      json = jsonParse(body);
      // emit that winner and outcome created
      // person can select new match and new game!
      // also make sure ruby amount changes, etc
      if (json["status"] === 428) {        
        console.log("no match data");
        // need to set up listener I think?
        // do I have to set up a dummy match to fill?
      }
      else if (json.data !== null) {
        console.log('api created the outcomes');
        io.emit('message', 'outcomes created!');
        io.emit('winnersCreated', json)
      }
    })
  })

  socket.on('searchForGame', function(data) {
    console.log(data)
    console.log("searching on server for game type " + data.data.game_type_id + " with game id " + data.data.game_id)
    request('http://localhost:3000/matches/search/' + data.data.game_type_id + "?game_id=" + data.data.game_id, function(error, response, body) {
      // search for match, if cannot find match keep searching, if can find match send data back to transitionTo the new match in the component!
      // need to find those guys like match 3 when match 4 finds to emit to transition back or something
      // set up listener on client that looks for these match ids then?
      console.log("search outputs: " + body);
      json = jsonParse(body);
      
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
