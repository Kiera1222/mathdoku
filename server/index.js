const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { generatePuzzle } = require('./puzzleGenerator');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Rooms are stored as: roomId (level-password) -> {players: [], puzzle: {}, gameStarted: false}
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Player joins a game
  socket.on('join_game', ({ level, password }) => {
    const roomId = `${level}-${password}`;
    
    // If room doesn't exist, create it
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [{ id: socket.id, ready: false, completed: false, time: null }],
        puzzle: null,
        gameStarted: false,
        level
      });
      socket.join(roomId);
      socket.emit('waiting_for_opponent', { roomId });
      console.log(`Player ${socket.id} created room ${roomId}`);
    } 
    // If room exists but has only one player
    else if (rooms.get(roomId).players.length === 1) {
      const room = rooms.get(roomId);
      
      // Check if this player is already in the room (reconnection)
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (existingPlayerIndex === -1) {
        // Add second player
        room.players.push({ id: socket.id, ready: false, completed: false, time: null });
        socket.join(roomId);
        
        // Generate puzzle if not already generated
        if (!room.puzzle) {
          room.puzzle = generatePuzzle(parseInt(level));
        }
        
        // Start the game
        room.gameStarted = true;
        io.to(roomId).emit('start_game', { puzzle: room.puzzle });
        console.log(`Player ${socket.id} joined room ${roomId}. Game starting!`);
      } else {
        // Player is reconnecting
        socket.join(roomId);
        if (room.gameStarted) {
          socket.emit('start_game', { puzzle: room.puzzle });
        } else {
          socket.emit('waiting_for_opponent', { roomId });
        }
      }
    } 
    // Room is full
    else if (rooms.get(roomId).players.length >= 2) {
      const room = rooms.get(roomId);
      
      // Check if this is a reconnection
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      if (existingPlayerIndex !== -1) {
        socket.join(roomId);
        if (room.gameStarted) {
          socket.emit('start_game', { puzzle: room.puzzle });
        }
      } else {
        socket.emit('room_full');
      }
    }
  });

  // Player completes the puzzle
  socket.on('puzzle_completed', ({ roomId, solution, time }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        room.players[playerIndex].completed = true;
        room.players[playerIndex].time = time;
        
        // Check if all players have completed
        const allCompleted = room.players.every(p => p.completed);
        
        // Notify all players about this player's completion
        io.to(roomId).emit('player_completed', { 
          playerId: socket.id,
          time,
          allCompleted
        });
        
        if (allCompleted) {
          // Sort players by completion time
          const sortedPlayers = [...room.players].sort((a, b) => a.time - b.time);
          io.to(roomId).emit('game_over', { 
            winner: sortedPlayers[0].id,
            results: sortedPlayers.map(p => ({ id: p.id, time: p.time }))
          });
          
          // Clean up room after some time
          setTimeout(() => {
            if (rooms.has(roomId)) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted after game completion`);
            }
          }, 60000); // 1 minute
        }
      }
    }
  });

  // Player disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms this player is in
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        // Notify other player
        socket.to(roomId).emit('opponent_disconnected');
        
        // If game hasn't started, remove player
        if (!room.gameStarted) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted after all players left`);
          }
        }
      }
    });
  });
});

app.get('/', (req, res) => {
  res.send('Mathdoku Game Server');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 