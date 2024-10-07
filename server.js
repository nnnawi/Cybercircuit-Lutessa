const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = [];
let currentPlayerIndex = 0;
const TOTAL_BOXES = 39;

const specialBoxes = {
  2: { action: 'move', value: 3 },
  4: { action: 'set', value: 0 },
  10: { action: 'skip', value: 0 },
  13: { action: 'set', value: 15},
  21: { action: 'move', value: 2},
  24: { action: 'set', value: 22},
  36: { action: 'move', value: -2},
};


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (playerName) => {
    if (players.length < 6) {
      players.push({ id: socket.id, name: playerName, position: 0});
      socket.emit('gameState', { players, currentPlayerIndex });
      socket.broadcast.emit('playerJoined', { id: socket.id, name: playerName });
      
      if (players.length === 1) {
        // First player joined, start their turn
        io.to(players[currentPlayerIndex].id).emit('yourTurn');
      }
    } else {
      socket.emit('gameFull');
    }
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  socket.on('rollDice', async (diceRoll) => {

    const playerIndex = players.findIndex(p => p.id === socket.id);
    if (playerIndex === currentPlayerIndex) {
      
      players[playerIndex].position = (players[playerIndex].position + diceRoll) //Update position based on dice roll

      let difference_to_end = TOTAL_BOXES - players[playerIndex].position; //Ensure that if position is bigger than TOTAL_BOX, pawn goes back
      if(difference_to_end < 0){
        players[playerIndex].position = TOTAL_BOXES + difference_to_end;
      }

      io.emit('gameState', { players, currentPlayerIndex }); //Update players position

      if(specialBoxes[players[playerIndex].position]){ //Test for special cases
        const specialAction = specialBoxes[players[playerIndex].position];
        
        if(specialAction.action == "move"){
          players[playerIndex].position = Math.min(players[playerIndex].position + specialAction.value, TOTAL_BOXES);
          await delay(500);
        }

        if(specialAction.action == "set"){
          players[playerIndex].position = specialAction.value;
          await delay(500);
        }

        if(specialAction.action == "skip"){
          io.to(players[playerIndex].id).emit('addSkip');
        }
      }
    
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length; //Set next turn to next player
      io.to(players[currentPlayerIndex].id).emit('yourTurn'); //Goes to next turn

      io.emit('gameState', { players, currentPlayerIndex }); //Update game state for every player

    }
  });

  socket.on('disconnect', () => {
    const disconnectedPlayerIndex = players.findIndex(p => p.id === socket.id);
    if (disconnectedPlayerIndex !== -1) {
      players.splice(disconnectedPlayerIndex, 1);
      if (disconnectedPlayerIndex < currentPlayerIndex) {
        currentPlayerIndex--;
      } else if (disconnectedPlayerIndex === currentPlayerIndex) {
        currentPlayerIndex = currentPlayerIndex % players.length;
      }
      currentPlayerIndex = Math.max(0, Math.min(currentPlayerIndex, players.length - 1));
      io.emit('playerLeft', socket.id);
      io.emit('gameState', { players, currentPlayerIndex });
      if (players.length > 0) {
        io.to(players[currentPlayerIndex].id).emit('yourTurn');
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});