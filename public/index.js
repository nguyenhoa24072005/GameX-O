const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  winner: null,
};

io.on("connection", (socket) => {
  console.log("A player connected");

  // Send the initial game state to the new player
  socket.emit("game state", gameState);

  socket.on("make move", ({ index, isPlayingWithComputer }) => {
    if (gameState.board[index] === "" && !gameState.winner) {
      gameState.board[index] = gameState.currentPlayer;
      checkWinner();

      // Switch player
      gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";

      if (isPlayingWithComputer && gameState.currentPlayer === "O") {
        // Computer makes a move
        makeComputerMove();
      } else {
        io.emit("game state", gameState); // Broadcast the updated game state
      }
    }
  });

  socket.on("reset game", () => {
    resetGame();
    io.emit("game state", gameState); // Reset game state
  });

  function makeComputerMove() {
    const emptyCells = gameState.board
      .map((cell, index) => (cell === "" ? index : null))
      .filter((index) => index !== null);

    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const move = emptyCells[randomIndex];
      gameState.board[move] = gameState.currentPlayer; // Computer plays
      checkWinner();
      gameState.currentPlayer = "X"; // Switch back to player X
      io.emit("game state", gameState); // Broadcast the updated game state
    }
  }

  function resetGame() {
    gameState = {
      board: Array(9).fill(""),
      currentPlayer: "X",
      winner: null,
    };
  }

  function checkWinner() {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (
        gameState.board[a] &&
        gameState.board[a] === gameState.board[b] &&
        gameState.board[a] === gameState.board[c]
      ) {
        gameState.winner = gameState.board[a];
        io.emit("game state", gameState); // Notify players of the winner
        break;
      }
    }
  }

  socket.on("disconnect", () => {
    console.log("A player disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
