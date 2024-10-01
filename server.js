const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

let gameState = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  winner: null,
};

io.on("connection", (socket) => {
  console.log("A player connected");

  socket.emit("game state", gameState);

  socket.on("make move", ({ index }) => {
    if (gameState.board[index] === "" && !gameState.winner) {
      gameState.board[index] = gameState.currentPlayer;
      checkWinner();
      gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
      io.emit("game state", gameState);
    }
  });

  socket.on("reset game", () => {
    resetGame();
    io.emit("game state", gameState);
  });

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
        io.emit("game state", gameState);
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
