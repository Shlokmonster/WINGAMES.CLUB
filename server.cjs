require('dotenv').config();
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
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
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
      // Match found! Randomly decide who will create the room
      const isCreator = Math.random() < 0.5;
      
      // Notify both players about the match and who will create the room
      io.to(waitingPlayer.socketId).emit('matchFound', { 
        isCreator: !isCreator, // Opposite of the current player
        opponent: { userId, username, socketId: socket.id },
        betAmount
      });
      
      socket.emit('matchFound', { 
        isCreator: isCreator,
        opponent: { userId: waitingPlayer.userId, username: waitingPlayer.username, socketId: waitingPlayer.socketId },
        betAmount
      });

      // Remove the waiting player from the queue
      waitingPlayers.delete(waitingPlayer.socketId);
    } else {
      // No match found, add to waiting queue
      waitingPlayers.set(socket.id, { userId, username, betAmount, socketId: socket.id });
      socket.emit('waitingForMatch', { message: 'Waiting for an opponent...' });
    }
  });

  // Handle room code creation by the designated player
  socket.on('createRoomCode', ({ userId, username, roomCode, opponentId, opponentSocketId }) => {
    console.log(`Player ${username} created room code: ${roomCode}`);
    
    // Create a game room
    const gameId = `game_${roomCode}`;
    
    // Store game room info
    gameRooms.set(gameId, {
      roomCode,
      players: [
        { userId, username, socketId: socket.id, ready: false, isCreator: true },
        { userId: opponentId, socketId: opponentSocketId, ready: false, isCreator: false }
      ],
      status: 'waiting',
      createdAt: new Date().toISOString()
    });
    
    // Join the creator to the room
    socket.join(gameId);
    
    // Notify creator that room was created
    socket.emit('roomCreated', { 
      roomCode,
      message: 'Room created. Waiting for opponent to join...'
    });

    // Notify opponent directly using their socketId
    if (opponentSocketId) {
      console.log('Emitting roomCodeAvailable to', opponentSocketId, 'with code', roomCode);
      io.to(opponentSocketId).emit('roomCodeAvailable', {
        roomCode,
        message: 'Opponent has created the room. Please join using the code.'
      });
    }
  });
  
  // Handle opponent joining with the room code
  socket.on('joinWithRoomCode', ({ userId, username, roomCode }) => {
    console.log(`Player ${username} joining with room code: ${roomCode}`);
    
    const gameId = `game_${roomCode}`;
    const gameRoom = gameRooms.get(gameId);
    
    if (!gameRoom) {
      socket.emit('roomError', { message: 'Room not found. Please check the room code.' });
      return;
    }
    
    // Update opponent info
    gameRoom.players[1].userId = userId;
    gameRoom.players[1].username = username;
    gameRoom.players[1].socketId = socket.id;
    
    // Join the player to the socket room
    socket.join(gameId);
    
    // Notify both players that they're in the same room
    io.to(gameRoom.players[0].socketId).emit('opponentJoined', { 
      opponent: { userId, username }
    });
    
    socket.emit('roomJoined', { 
      roomCode,
      opponent: { 
        userId: gameRoom.players[0].userId, 
        username: gameRoom.players[0].username 
      }
    });
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
    // Check if we have valid Supabase credentials
    if (!supabaseUrl || supabaseUrl === 'https://your-supabase-url.supabase.co' || 
        !supabaseKey || supabaseKey === 'your-supabase-key') {
      console.log('Skipping Supabase storage: Invalid credentials');
      return;
    }
    
    // Ensure bet_amount is set
    let betAmount = gameRoom.betAmount;
    if (betAmount === undefined || betAmount === null) {
      console.warn('Warning: betAmount is missing in gameRoom, defaulting to 0');
      betAmount = 0;
    }
    
    const { data, error } = await supabase
      .from('games')
      .insert([
        {
          room_code: gameRoom.roomCode,
          bet_amount: betAmount,
          status: gameRoom.status,
          created_at: gameRoom.createdAt,
          game_type: 'ludo',
          game_data: {
            players: gameRoom.players.map(p => ({
              user_id: p.userId,
              username: p.username
            }))
          }
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
    // Check if we have valid Supabase credentials
    if (!supabaseUrl || supabaseUrl === 'https://your-supabase-url.supabase.co' || 
        !supabaseKey || supabaseKey === 'your-supabase-key') {
      console.log('Skipping Supabase update: Invalid credentials');
      return;
    }
    
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