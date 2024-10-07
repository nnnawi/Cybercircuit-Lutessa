let socket;
let players = [];
let currentPlayerIndex = 0;
let myId;
let TOTAL_BOXES = 39;
let playerColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
let rollButton, skipButton;
let myTurn = false;
let skipTurn = 0;

let backgroundImg;
let canvasRatio = 2000 / 1414; // ratio of the background image
let scaleRatio = 1;

let og_width = 1165;
let og_height = 824;

let isRolling = false;
let rollStartTime = 0;
let rollDuration = 2000; // 2 seconds
let currentRoll = 1;
let finalRoll = 1;

let currentChallenge = null;


function preload() {
  backgroundImg = loadImage('assets/background.png');
}

function setup() {
  let canvas = createCanvas((windowHeight - 100) * canvasRatio, windowHeight - 100);
  canvas.parent('game-container');
  socket = io();

  let playerName = prompt("Enter your name:");
  socket.emit('join', playerName);

  socket.on('gameState', updateGameState);
  socket.on('playerJoined', (player) => {
    console.log(`${player.name} joined the game`);
  });
  socket.on('playerLeft', (playerId) => {
    console.log(`Player left the game`);
    players = players.filter(p => p.id !== playerId);
  });
  socket.on('gameFull', () => {
    console.log("The game is full");
  });
  socket.on('addSkip', () => {
    skipTurn += 1;
  });
  socket.on('yourTurn', () => {
    if(skipTurn == 1){
      movePawn(0);
    }
    else if(skipTurn == 2){
      skipTurn = 0;
      myTurn = true;
      if (rollButton) rollButton.show();
    }
    else{
      myTurn = true;
      if (rollButton) rollButton.show();
    }
  });

  rollButton = createButton('Roll Dice');
  rollButton.position(10, height - 40);
  rollButton.mousePressed(startRollAnimation);
  rollButton.hide(); // Hide initially, show only on player's turn

  windowResized(); // Initial call to set up the canvas size

}

function windowResized() {
  resizeCanvas((windowHeight - 100) * canvasRatio, windowHeight - 100);

  // Reposition the roll button
  rollButton.position(10, height - 40);
}

function draw() {
  background(220);
  
  // Draw the background image
  push();
  image(backgroundImg, 0, 0, width, height);
  pop();

  scale(width / og_width);
  drawPlayerInfo();
  drawPlayers();

  if (isRolling) {
    drawDiceRoll();
  }
}

function drawPlayers() {
  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    let x = board_case_positions[player.position][0];
    let y = board_case_positions[player.position][1];
    
    
    fill(playerColors[i]);
    ellipse(x, y, 30);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(player.name.charAt(0), x, y);
  }
}

function drawPlayerInfo() {
  textAlign(LEFT, BOTTOM);
  textSize(16);
  fill(255);
  text(`Current Turn: ${players[currentPlayerIndex]?.name || 'Waiting for players'}`, 10, og_height - 20 - players.length * 20);
}

function updateGameState(state) {
  console.log(state);
  players = state.players;
  currentPlayerIndex = state.currentPlayerIndex;
  myId = socket.id;
  myTurn = players[currentPlayerIndex]?.id === myId;
  if (rollButton) {
    myTurn && !isRolling ? rollButton.show() : rollButton.hide();
  }
}

function rollDice() {
  if (myTurn) {
    socket.emit('rollDice');
    myTurn = false;
    rollButton.hide();
  }
}

function drawDiceRoll() {
  let elapsedTime = millis() - rollStartTime;
  
  if (elapsedTime < rollDuration) {
    // During animation, rapidly change the displayed number
    if (frameCount % 5 === 0) { // Change number every 5 frames for a flickering effect
      currentRoll = floor(random(1, 7));
    }
  } else if (elapsedTime < rollDuration + 2000){
    // Animation finished
    currentRoll = finalRoll;
  }
  else {
    isRolling = false;
    movePawn(finalRoll);
  }

  // Display the current roll
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  ellipseMode(CENTER);
  ellipse(og_width / 2, og_height / 2, 70 , 70 );
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(currentRoll, og_width / 2, og_height / 2);
  pop();
}

function startRollAnimation() {
  if (myTurn && !isRolling) {
    isRolling = true;
    rollStartTime = millis();
    finalRoll = floor(random(1, 7));
    //finalRoll = 1;
    rollButton.hide();
  }
}

function movePawn(steps) {
  socket.emit('rollDice', steps);
  myTurn = false;
}

let board_case_positions = [
[68, 710],
[182, 710],
[294, 710],
[411, 710],
[520, 710],
[637, 710],
[751, 710],
[862, 710],
[978, 710],
[1091, 710],
[1034, 608],
[1093, 510],
[1033, 414],
[1091, 313],
[1031, 218],
[1087, 115],
[972, 115],
[860, 115],
[750, 115],
[633, 115],
[520, 115],
[406, 115],
[291, 115],
[181, 115],
[239, 219],
[178, 315],
[236, 412],
[178, 507],
[292,507],
[407,507],
[520, 507],
[633, 507],
[750, 507],
[860, 507],
[802, 408],
[860, 313],
[745, 315],
[637, 315],
[520, 315],
[407, 315]]