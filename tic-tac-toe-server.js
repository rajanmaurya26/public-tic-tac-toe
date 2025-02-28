// tic-tac-toe-server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*", // Be cautious with '*' in production. Specify your client origin.
        methods: ["GET", "POST"]
    }
});

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let players = {};
let playerSockets = {};
let gameInProgress = false;

function checkWinner(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) {
        return 'draw';
    }
    return null;
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameInProgress = false;
    io.emit('boardUpdate', board);
    io.emit('playerTurn', currentPlayer);
}

io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    if (Object.keys(players).length < 2) {

        const playerSymbol = Object.keys(players).length === 0 ? 'X' : 'O';
        players[socket.id] = playerSymbol;
        playerSockets[playerSymbol] = socket;

        socket.emit('playerSymbol', playerSymbol);
        console.log(`Player ${playerSymbol} connected`);

        if (Object.keys(players).length === 2) {
            gameInProgress = true;
            io.emit('gameStart', 'Game started');
            io.emit('boardUpdate', board);
            io.emit('playerTurn', currentPlayer);
        }

    } else {
        socket.emit('fullGame', 'Game is full');
        socket.disconnect(true);
    }

    socket.on('makeMove', (index) => {
        if (gameInProgress && players[socket.id] === currentPlayer && board[index] === '') {
            board[index] = currentPlayer;
            io.emit('boardUpdate', board);

            const winner = checkWinner(board);
            if (winner) {
                io.emit('gameOver', winner);
                resetGame();
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                io.emit('playerTurn', currentPlayer);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        if(players[socket.id]){
            delete playerSockets[players[socket.id]];
            delete players[socket.id];
            resetGame();
        }
        if(Object.keys(players).length < 2 && gameInProgress){
            gameInProgress = false;
            io.emit('gameEnded','Other player disconnected');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server is running on port 3000', Samosa);
    console.log(`Server listening on port ${PORT}`);
});