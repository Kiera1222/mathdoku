const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { generatePuzzle } = require('./puzzleGenerator');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json()); // Add JSON body parser

// Serve static files from React app - for Render.com deployment
// Check if we're in production build path or development
const clientBuildPath = path.resolve(__dirname, '../client/build');
const publicPath = path.resolve(__dirname, 'public');
const staticPath = fs.existsSync(clientBuildPath) ? clientBuildPath : publicPath;

app.use(express.static(staticPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

// Rooms are stored as: roomId (level-password) -> {players: [], puzzle: {}, gameStarted: false}
const rooms = new Map();

// Cache for password-based puzzles (non-multiplayer)
const puzzleCache = new Map();

// Endpoint to get a puzzle based on size and password (for single-player mode)
app.post('/api/puzzle', (req, res) => {
  const { size, password } = req.body;
  
  if (!size || size < 3 || size > 9) {
    return res.status(400).json({ error: 'Invalid size. Must be between 3 and 9.' });
  }
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  
  // Create a unique cache key
  const cacheKey = `${size}-${password}`;
  
  // Check if puzzle is already in cache
  if (puzzleCache.has(cacheKey)) {
    return res.json(puzzleCache.get(cacheKey));
  }
  
  // Generate new puzzle with password as seed
  const puzzle = generatePuzzle(size, password);
  
  // Store in cache
  puzzleCache.set(cacheKey, puzzle);
  
  // Clean up cache after some time to prevent memory leaks
  setTimeout(() => {
    if (puzzleCache.has(cacheKey)) {
      puzzleCache.delete(cacheKey);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  res.json(puzzle);
});

// Health check endpoint for Fly.io
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Player creates a new game
  socket.on('create_game', ({ level, password }) => {
    const roomId = `${level}-${password}`;
    
    // Check if room already exists
    if (rooms.has(roomId)) {
      socket.emit('game_already_exists');
      console.log(`Player ${socket.id} tried to create room ${roomId} but it already exists.`);
      return;
    }
    
    // Create a new room
    rooms.set(roomId, {
      players: [{ id: socket.id, ready: false, completed: false, time: null }],
      puzzle: null,
      gameStarted: false,
      level,
      creator: socket.id
    });
    
    socket.join(roomId);
    socket.emit('waiting_for_opponent', { roomId });
    console.log(`Player ${socket.id} created room ${roomId}`);
  });

  // Player joins an existing game
  socket.on('join_game', ({ level, password }) => {
    const roomId = `${level}-${password}`;
    
    // If room doesn't exist, notify the user
    if (!rooms.has(roomId)) {
      socket.emit('game_not_found');
      console.log(`Player ${socket.id} tried to join non-existent room ${roomId}`);
      return;
    }
    
    const room = rooms.get(roomId);
    
    // If room exists but has only one player
    if (room.players.length === 1) {
      // Check if this player is already in the room (reconnection)
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (existingPlayerIndex === -1) {
        // Add second player
        room.players.push({ id: socket.id, ready: false, completed: false, time: null });
        socket.join(roomId);
        
        // Generate puzzle if not already generated
        if (!room.puzzle) {
          room.puzzle = generatePuzzle(parseInt(level), password);
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
          
          // Check if the other player has completed the puzzle
          const otherPlayer = room.players.find(p => p.id !== socket.id);
          if (otherPlayer && otherPlayer.completed) {
            socket.emit('player_completed', { 
              playerId: otherPlayer.id,
              time: otherPlayer.time,
              allCompleted: false
            });
          }
        } else {
          socket.emit('waiting_for_opponent', { roomId });
        }
      }
    }
    // Room is full
    else if (room.players.length >= 2) {
      // Check if this is a reconnection
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      if (existingPlayerIndex !== -1) {
        socket.join(roomId);
        if (room.gameStarted) {
          socket.emit('start_game', { puzzle: room.puzzle });
          
          // Check if the other player has completed the puzzle
          const otherPlayer = room.players.find(p => p.id !== socket.id);
          if (otherPlayer && otherPlayer.completed) {
            socket.emit('player_completed', { 
              playerId: otherPlayer.id,
              time: otherPlayer.time,
              allCompleted: room.players[existingPlayerIndex].completed // Check if both completed
            });
          }
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

// For any routes not handled before, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 