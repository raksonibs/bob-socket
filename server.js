// 'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var request = require('request');
const debug = require('debug');
var json;
const cors = require('cors');



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

var baseUrl;

if (process.env.NODE_ENV === "development") {
  baseUrl = "http://localhost:3000"
} else {
  baseUrl = "https://protected-earth-92148.herokuapp.com"
}

const PORT = process.env.PORT || 3001;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .use(cors())
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

const io = socketIO(server);

// io.set('origins', 'https://ggamble.pagefrontapp.com:80');
io.set('origins', 'https://ggamble.pagefrontapp.com:* http://ggamble.pagefrontapp.com:* ggamble.pagefrontapp.com:*')

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
  socket.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  socket.on('resetMover', function(data) {
    console.log("RESETING MOVER DATA IN RAILS APP");
    request.patch({url: baseUrl + "/movers/" + data.data.mover_id + "/reset"}, function(error, response, body) {
      console.log(body)
      json = jsonParse(body);
      // io.emit('updateCurrentTurn', json)
    })
  })

  socket.on('turnChange', function(data) {
    // only want to update based on match id
    console.log("NEED TO TURN CHANGE OVER HERE")
    console.log('need to update change')
    console.log(data)
    var matchId;
    // might want to grab match?
    if (data.data.match.uniqueId === null) {
      matchId = data.data.match.mover;
    } else {
      matchId = data.data.match.uniqueId;
    }

    console.log("HERE IS THE MATCH ID WE ARE UPDATING CURRENTLY: " + matchId);
    request.patch({url: baseUrl + "/matches/' + matchId, data: data}, function(error, response, body) {
      console.log("HERE IS THE TURN CHANGE JSON");
      console.log(body)
      json = jsonParse(body);
      io.emit('updateCurrentTurn', json)
    })
  })

  socket.on('requestAllMoves', function(data) {
    console.log("REQUESTING ALL DATA FOR MOVER: " + data.data.match);
    console.log(data);

    request.get({url: baseUrl + "/movers/' + data.data.match}, function(error, response, body) {
      console.log("BROADCASTING ALL MOVES");
      console.log(body);
      json = jsonParse(body);
      io.emit("updateGameView", json);
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
    request.post({url: baseUrl + "/matches/" + data.data.match.uniqueId +"/record_move?choice=" + choice + "&user=" + data.data.user_id, data: json}, function(error, response, body) {
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
        io.emit('updateGameView', json);
      }

    })
  })

  socket.on('winnerMatch', function(data) {
    console.log(data);
    console.log("recording winner for match id" + data.data.match.uniqueId + " and winner is " + data.data.user_id);
    request.post({url: baseUrl + "/matches/" + data.data.match.uniqueId + "/winner/?user_id=" + data.data.user_id, data: data}, function(error, response, body) {
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
    request(baseUrl + "/matches/search/' + data.data.game_type_id + "?game_id=" + data.data.game_id, function(error, response, body) {
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
