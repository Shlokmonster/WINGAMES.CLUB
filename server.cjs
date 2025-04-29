const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('redis');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// Initialize Redis client
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Store active players waiting for a match
const waitingPlayers = new Map();

// Store active game rooms
const gameRooms = new Map();

// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle player joining the matchmaking queue
  socket.on('joinMatchmaking', async ({ userId, username, betAmount }) => {
    console.log(`Player ${username} (${userId}) joined matchmaking with bet amount: ${betAmount}`);
    
    // Check if there's a player waiting with the same bet amount
    const waitingPlayer = Array.from(waitingPlayers.values()).find(
      player => player.betAmount === betAmount && player.userId !== userId
    );

    if (waitingPlayer) {
      // Match found! Create a game room
      const roomCode = generateRoomCode();
      const gameId = `game_${roomCode}`;
      
      // Store game room info
      gameRooms.set(gameId, {
        roomCode,
        players: [
          { userId: waitingPlayer.userId, username: waitingPlayer.username, socketId: waitingPlayer.socketId, ready: false },
          { userId, username, socketId: socket.id, ready: false }
        ],
        betAmount,
        status: 'waiting',
        createdAt: new Date().toISOString()
      });

      // Remove the waiting player from the queue
      waitingPlayers.delete(waitingPlayer.socketId);

      // Notify both players about the match
      io.to(waitingPlayer.socketId).emit('matchFound', { 
        roomCode, 
        opponent: { userId, username },
        isCreator: true // First player creates the room
      });
      
      socket.emit('matchFound', { 
        roomCode, 
        opponent: { userId: waitingPlayer.userId, username: waitingPlayer.username },
        isCreator: false
      });

      // Join both players to the game room
      socket.join(gameId);
      io.sockets.sockets.get(waitingPlayer.socketId).join(gameId);
    } else {
      // No match found, add to waiting queue
      waitingPlayers.set(socket.id, { userId, username, betAmount, socketId: socket.id });
      socket.emit('waitingForMatch', { message: 'Waiting for an opponent...' });
    }
  });

  // Handle player ready status
  socket.on('playerReady', ({ roomCode }) => {
    const gameId = `game_${roomCode}`;
    const gameRoom = gameRooms.get(gameId);
    
    if (gameRoom) {
      // Update player ready status
      const playerIndex = gameRoom.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        gameRoom.players[playerIndex].ready = true;
        
        // Check if both players are ready
        const allPlayersReady = gameRoom.players.every(p => p.ready);
        
        if (allPlayersReady) {
          // Both players are ready, update game status
          gameRoom.status = 'active';
          
          // Store game in Supabase
          storeGameInSupabase(gameRoom);
          
          // Notify players that game is starting
          io.to(gameId).emit('gameStarting', { 
            message: 'Both players are ready! Game is starting...',
            gameId: gameRoom.roomCode
          });
        } else {
          // Notify players that one player is ready
          io.to(gameId).emit('playerReadyUpdate', { 
            readyPlayers: gameRoom.players.filter(p => p.ready).length,
            totalPlayers: gameRoom.players.length
          });
        }
      }
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from waiting queue if applicable
    if (waitingPlayers.has(socket.id)) {
      waitingPlayers.delete(socket.id);
    }
    
    // Handle disconnection from active game rooms
    for (const [gameId, gameRoom] of gameRooms.entries()) {
      const playerIndex = gameRoom.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        // Notify other players that someone left
        io.to(gameId).emit('playerLeft', { 
          message: `${gameRoom.players[playerIndex].username} has left the game.`
        });
        
        // Update game status
        gameRoom.status = 'abandoned';
        
        // Store updated game status in Supabase
        updateGameInSupabase(gameRoom);
        
        // Remove the game room after a delay
        setTimeout(() => {
          gameRooms.delete(gameId);
        }, 5000);
      }
    }
  });
});

// Store game in Supabase
async function storeGameInSupabase(gameRoom) {
  try {
    const { data, error } = await supabase
      .from('games')
      .insert([
        {
          room_code: gameRoom.roomCode,
          bet_amount: gameRoom.betAmount,
          status: gameRoom.status,
          created_at: gameRoom.createdAt,
          players: gameRoom.players.map(p => ({
            user_id: p.userId,
            username: p.username
          }))
        }
      ]);
    
    if (error) throw error;
    console.log('Game stored in Supabase:', data);
  } catch (error) {
    console.error('Error storing game in Supabase:', error);
  }
}

// Update game in Supabase
async function updateGameInSupabase(gameRoom) {
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status: gameRoom.status })
      .eq('room_code', gameRoom.roomCode);
    
    if (error) throw error;
    console.log('Game updated in Supabase:', data);
  } catch (error) {
    console.error('Error updating game in Supabase:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 