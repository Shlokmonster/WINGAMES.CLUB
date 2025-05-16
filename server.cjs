require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('redis');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
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

// Use Redis for persistence of battles
// Redis keys: 'openBattles', 'runningBattles' (as hashes)

// Helper functions for Redis CRUD
async function addOpenBattle(battle) {
  await redisClient.hSet('openBattles', battle.id, JSON.stringify(battle));
}

async function getAllOpenBattles() {
  const all = await redisClient.hGetAll('openBattles');
  return Object.values(all).map(val => JSON.parse(val));
}

async function removeOpenBattle(battleId) {
  await redisClient.hDel('openBattles', battleId);
}

async function addRunningBattle(battle) {
  await redisClient.hSet('runningBattles', battle.id, JSON.stringify(battle));
}

async function getAllRunningBattles() {
  const all = await redisClient.hGetAll('runningBattles');
  return Object.values(all).map(val => JSON.parse(val));
}

async function getAllMatchedBattles() {
  const all = await redisClient.hGetAll('matchedBattles');
  return Object.values(all).map(val => JSON.parse(val));
}

async function getMatchedBattleById(battleId) {
  const battleJson = await redisClient.hGet('matchedBattles', battleId);
  return battleJson ? JSON.parse(battleJson) : null;
}

async function removeMatchedBattle(battleId) {
  await redisClient.hDel('matchedBattles', battleId);
}

async function removeRunningBattle(battleId) {
  await redisClient.hDel('runningBattles', battleId);
}

async function updateOpenBattle(battleId, updatedBattle) {
  await redisClient.hSet('openBattles', battleId, JSON.stringify(updatedBattle));
}

async function getOpenBattleById(battleId) {
  const battleJson = await redisClient.hGet('openBattles', battleId);
  return battleJson ? JSON.parse(battleJson) : null;
}

async function getRunningBattleById(battleId) {
  const battleJson = await redisClient.hGet('runningBattles', battleId);
  return battleJson ? JSON.parse(battleJson) : null;
}


// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate a battle ID
function generateBattleId() {
  return uuidv4();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // --- CREATE BATTLE ---
  socket.on('createBattle', async ({ userId, username, entryFee, comment }) => {
    console.log(`User ${username} is creating a battle with entry fee: ${entryFee}`);
    // Check creator's wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (walletError || !wallet || wallet.balance < entryFee) {
      socket.emit('battleError', { message: 'Insufficient wallet balance to create this battle.' });
      return;
    }
    const battleId = generateBattleId();
    const battle = {
      id: battleId,
      creator: { userId, username, socketId: socket.id },
      entryFee,
      prize: Math.floor(entryFee * 1.85), // 85% payout (15% fee)
      comment,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    await addOpenBattle(battle);
    const openBattles = await getAllOpenBattles();
    socket.emit('battleCreated', { battle });
    io.emit('openBattlesUpdate', { openBattles });
  });

  // --- GET OPEN BATTLES ---
  socket.on('getOpenBattles', async () => {
    const openBattles = await getAllOpenBattles();
    socket.emit('openBattlesUpdate', { openBattles });
  });

  // --- GET RUNNING BATTLES ---
  socket.on('getRunningBattles', async () => {
    const runningBattles = await getAllRunningBattles();
    const matchedBattles = await getAllMatchedBattles();
    socket.emit('runningBattlesUpdate', { runningBattles, matchedBattles });
  });

  // --- JOIN BATTLE ---
  socket.on('joinBattle', async ({ battleId, userId, username }) => {
    console.log(`User ${username} is trying to join battle: ${battleId}`);
    const battle = await getOpenBattleById(battleId);
    if (!battle || battle.status !== 'open') {
      socket.emit('battleError', { message: 'Battle not found or already joined.' });
      return;
    }
    
    // Check both joiner's and creator's wallet balances
    const [{ data: joinerWallet, error: joinerWalletError }, { data: creatorWallet, error: creatorWalletError }] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', userId).single(),
      supabase.from('wallets').select('balance').eq('user_id', battle.creator.userId).single()
    ]);
    
    if (joinerWalletError || !joinerWallet || joinerWallet.balance < battle.entryFee) {
      socket.emit('battleError', { message: 'Insufficient wallet balance to join this battle.' });
      return;
    }
    
    if (creatorWalletError || !creatorWallet || creatorWallet.balance < battle.entryFee) {
      socket.emit('battleError', { message: 'Creator no longer has sufficient funds. Try another battle.' });
      // Remove the battle from open battles
      await removeOpenBattle(battleId);
      const newOpenBattles = await getAllOpenBattles();
      io.emit('openBattlesUpdate', { openBattles: newOpenBattles });
      return;
    }
    
    // Update battle status and opponent
    battle.status = 'matched';
    battle.opponent = { userId, username, socketId: socket.id };
    
    // Keep the battle in 'matched' state until both players are ready
    // We'll move it to 'running' only after room code exchange and both players ready
    const matchedBattle = {
      ...battle,
      status: 'matched',
      matchedAt: new Date().toISOString(),
    };
    
    // Remove from open battles but don't add to running battles yet
    await removeOpenBattle(battleId);
    
    // Store the matched battle in Redis under a different key
    await redisClient.hSet('matchedBattles', battleId, JSON.stringify(matchedBattle));
    
    const newOpenBattles = await getAllOpenBattles();
    
    // Create customized battle objects for creator and joiner to ensure correct opponent display
    // The battle creator is the one who should share the room code
    const creatorBattleView = {
      ...matchedBattle,
      // For creator, explicitly set who the opponent is
      viewerRole: 'creator',  // Creator of the battle shares the room code
      isRoomCodeCreator: true, // Flag to indicate this player should create the room code
      opponent: { userId, username, socketId: socket.id }
    };
    
    const joinerBattleView = {
      ...matchedBattle,
      // For joiner, explicitly set who the opponent is
      viewerRole: 'joiner',
      isRoomCodeCreator: false, // Flag to indicate this player should wait for the room code
      opponent: { 
        userId: battle.creator.userId, 
        username: battle.creator.username, 
        socketId: battle.creator.socketId 
      }
    };
    
    console.log('Sending to creator:', JSON.stringify(creatorBattleView));
    console.log('Sending to joiner:', JSON.stringify(joinerBattleView));
    
    // Notify creator with their view
    io.to(battle.creator.socketId).emit('battleMatched', { battle: creatorBattleView });
    // Notify joiner with their view
    io.to(socket.id).emit('battleMatched', { battle: joinerBattleView });
    
    // Update all clients with current battles
    io.emit('openBattlesUpdate', { openBattles: newOpenBattles });
    
    // We don't need to send running battles here since the battle is in matched state
  });

  // --- DELETE BATTLE ---
  socket.on('deleteBattle', async ({ battleId, userId }) => {
    console.log(`User ${userId} is trying to delete battle: ${battleId}`);
    const battle = await getOpenBattleById(battleId);
    if (!battle) {
      socket.emit('battleError', { message: 'Battle not found.' });
      return;
    }
    
    if (battle.creator.userId !== userId) {
      socket.emit('battleError', { message: 'You can only delete battles you created.' });
      return;
    }
    
    await removeOpenBattle(battleId);
    const newOpenBattles = await getAllOpenBattles();
    socket.emit('battleDeleted', { battleId });
    io.emit('openBattlesUpdate', { openBattles: newOpenBattles });
  });
  
  // --- START GAME FROM OPEN BATTLE ---
  socket.on('startGame', async ({ battleId, roomCode }) => {
    console.log(`Starting game for battle ${battleId} with room code ${roomCode}`);
    const battle = await getRunningBattleById(battleId);
    if (!battle) {
      socket.emit('battleError', { message: 'Battle not found or not in running state.' });
      return;
    }
    
    // Create a game room entry
    const gameId = `game_${roomCode}`;
    const gameRoom = {
      roomCode,
      betAmount: battle.entryFee,
      status: 'created',
      createdAt: new Date().toISOString(),
      players: [
        {
          userId: battle.creator.userId,
          username: battle.creator.username,
          socketId: battle.creator.socketId,
          ready: false
        },
        {
          userId: battle.opponent.userId,
          username: battle.opponent.username,
          socketId: battle.opponent.socketId,
          ready: false
        }
      ]
    };
    
    gameRooms.set(gameId, gameRoom);
    
    // Notify both players to join the game room
    io.to(battle.creator.socketId).emit('gameCreated', { 
      roomCode,
      betAmount: battle.entryFee,
      opponent: {
        userId: battle.opponent.userId,
        username: battle.opponent.username
      }
    });
    
    io.to(battle.opponent.socketId).emit('gameCreated', {
      roomCode,
      betAmount: battle.entryFee,
      opponent: {
        userId: battle.creator.userId,
        username: battle.creator.username
      }
    });
  });

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
  socket.on('createRoomCode', (payload) => {
    console.log('SERVER createRoomCode payload:', payload);
    const { userId, username, roomCode, opponentId, opponentSocketId, betAmount } = payload;
    console.log(`Player ${username} created room code: ${roomCode} with betAmount: ${betAmount}`);
    
    // Create a game room
    const gameId = `game_${roomCode}`;
    
    // Store game room info with explicit bet amount
    console.log('Creating game room with betAmount:', betAmount);
    gameRooms.set(gameId, {
      roomCode,
      betAmount: parseInt(betAmount) || 0, // Ensure betAmount is set as a number
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
    
    // Update opponent info and preserve all properties (including betAmount)
    gameRooms.set(gameId, {
      ...gameRoom,
      players: [
        gameRoom.players[0],
        { userId, username, socketId: socket.id, ready: false, isCreator: false }
      ]
    });
    // Log the updated gameRoom after join
    console.log('After joinWithRoomCode, gameRoom:', JSON.stringify(gameRooms.get(gameId)));
    
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
  socket.on('playerReady', async ({ roomCode, userId, username }) => {
    const gameId = `game_${roomCode}`;
    let gameRoom = gameRooms.get(gameId);

    console.log('Initial gameRoom state:', JSON.stringify(gameRoom));
    console.log('Player ready event from userId:', userId, 'username:', username);

    if (gameRoom) {
      // Update player ready status - first try to find by socketId
      let playerIndex = gameRoom.players.findIndex(p => p.socketId === socket.id);
      
      // If not found by socketId, try to find by userId (more reliable)
      if (playerIndex === -1 && userId) {
        playerIndex = gameRoom.players.findIndex(p => p.userId === userId);
        console.log('Found player by userId at index:', playerIndex);
      }
      
      if (playerIndex !== -1) {
        // Update the player's ready status
        gameRoom.players[playerIndex].ready = true;
        console.log(`Player ${gameRoom.players[playerIndex].username} (${gameRoom.players[playerIndex].userId}) is now ready`);
        
        // Log the current ready status of all players
        console.log('Current ready status:');
        gameRoom.players.forEach((player, idx) => {
          console.log(`Player ${idx}: ${player.username} (${player.userId}) - Ready: ${player.ready}`);
        });
        
        // Find the opponent player
        const initialOpponentIndex = playerIndex === 0 ? 1 : 0;
        const initialOpponent = gameRoom.players[initialOpponentIndex];
        console.log(`Opponent is player ${initialOpponentIndex}: ${initialOpponent.username} (${initialOpponent.userId}) - Ready: ${initialOpponent.ready}`);
        
        // Save the updated gameRoom back to the Map
        gameRooms.set(gameId, gameRoom);

        // Re-fetch the latest gameRoom
        gameRoom = gameRooms.get(gameId);
        console.log('Updated gameRoom after ready:', JSON.stringify(gameRoom));

        // Check if both players are ready
        const allPlayersReady = gameRoom.players.every(p => p.ready);
        console.log('All players ready:', allPlayersReady);

        // CRITICAL FIX: Use a more direct approach to ensure ready status synchronization
        // Get the current player and opponent
        const currentPlayer = gameRoom.players[playerIndex];
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        const opponent = gameRoom.players[opponentIndex];
        
        console.log(`Current player: ${currentPlayer.username} (${currentPlayer.userId}) - Ready: ${currentPlayer.ready}`);
        console.log(`Opponent: ${opponent.username} (${opponent.userId}) - Ready: ${opponent.ready}`);
        
        // Create a simple, direct ready status update
        const readyStatusUpdate = {
          roomCode: roomCode,
          currentPlayer: {
            userId: currentPlayer.userId,
            username: currentPlayer.username,
            isReady: currentPlayer.ready,
            isCreator: currentPlayer.isCreator
          },
          opponent: {
            userId: opponent.userId,
            username: opponent.username,
            isReady: opponent.ready,
            isCreator: opponent.isCreator
          },
          allPlayersReady: gameRoom.players.every(p => p.ready),
          timestamp: new Date().toISOString()
        };
        
        console.log('Sending direct ready status update:', JSON.stringify(readyStatusUpdate));
        
        // Send to BOTH players directly - don't rely on room messaging
        if (currentPlayer.socketId) {
          console.log(`Sending update directly to current player: ${currentPlayer.username}`);
          io.to(currentPlayer.socketId).emit('directReadyUpdate', readyStatusUpdate);
        }
        
        if (opponent.socketId) {
          console.log(`Sending update directly to opponent: ${opponent.username}`);
          io.to(opponent.socketId).emit('directReadyUpdate', readyStatusUpdate);
        }
        
        // Also broadcast to the room as a fallback
        io.to(gameId).emit('directReadyUpdate', readyStatusUpdate);

        if (allPlayersReady) {
          console.log('Both players ready, starting game process');
          // Set game status to active
          gameRoom.status = 'active';
          gameRooms.set(gameId, gameRoom);
          
          // Process wallet deductions for both players
          try {
            // Get the bet amount from the game room
            const betAmount = parseInt(gameRoom.betAmount) || 0;
            console.log(`Processing wallet deductions for bet amount: ${betAmount}`);
            
            // Only proceed with deductions if there's a bet amount and deductions haven't happened yet
            if (betAmount > 0 && !gameRoom.deductionsProcessed) {
              // Mark that deductions are being processed to prevent double deductions
              gameRoom.deductionsProcessed = true;
              gameRooms.set(gameId, gameRoom);
              
              // Deduct from both players' wallets
              for (const player of gameRoom.players) {
                try {
                  // Get the player's current wallet balance
                  const { data: walletData, error: walletError } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', player.userId)
                    .single();
                  
                  if (walletError) {
                    console.error(`Error fetching wallet for user ${player.userId}:`, walletError);
                    continue; // Skip this player but continue with the game
                  }
                  
                  const currentBalance = walletData?.balance || 0;
                  console.log(`Current balance for ${player.username} (${player.userId}): ${currentBalance}`);
                  
                  // Check if player has enough balance
                  if (currentBalance < betAmount) {
                    console.error(`User ${player.username} (${player.userId}) doesn't have enough balance. Has: ${currentBalance}, Needs: ${betAmount}`);
                    // Send an error message to this player
                    if (player.socketId) {
                      io.to(player.socketId).emit('walletError', {
                        message: `You don't have enough balance to join this game. You need ₹${betAmount} but have ₹${currentBalance}.`
                      });
                    }
                    continue; // Skip this player but continue with the game
                  }
                  
                  // Update the wallet with the new balance
                  const newBalance = currentBalance - betAmount;
                  const { error: updateError } = await supabase
                    .from('wallets')
                    .update({ balance: newBalance })
                    .eq('user_id', player.userId);
                  
                  if (updateError) {
                    console.error(`Error updating wallet for user ${player.userId}:`, updateError);
                    continue; // Skip transaction recording if wallet update failed
                  } else {
                    console.log(`Successfully deducted ${betAmount} from ${player.username}'s wallet. New balance: ${newBalance}`);
                    
                    // Calculate balance after transaction for history
                    const balanceAfter = newBalance;
                    
                    // Record the transaction in the wallet_transactions table
                    const { error: transactionError } = await supabase
                      .from('wallet_transactions')
                      .insert({
                        user_id: player.userId,
                        amount: betAmount, // Store as positive amount
                        type: 'bet', // Using 'bet' which is an allowed type based on the schema
                        description: `Entry fee for Ludo game ${gameRoom.roomCode}`,
                        status: 'completed',
                        created_at: new Date().toISOString(),
                        balance_after: balanceAfter // Add the balance after transaction
                      });
                    
                    if (transactionError) {
                      console.error(`Error recording transaction for user ${player.userId}:`, transactionError);
                    } else {
                      console.log(`Successfully recorded transaction for ${player.username}`);
                    }
                  }
                } catch (err) {
                  console.error(`Unexpected error processing wallet for user ${player.userId}:`, err);
                }
              }
            } else {
              console.log('No bet amount to deduct, skipping wallet deductions');
            }
          } catch (err) {
            console.error('Error processing wallet deductions:', err);
          }
          
          // Create game start payload with proper bet amount
          const gameBetAmount = parseInt(gameRoom.betAmount) || 0;
          console.log('Sending gameStart with betAmount:', gameBetAmount);
          
          // CRITICAL FIX: Send direct game start events to both players
          // This ensures both players receive the event regardless of socket room issues
          
          // Send to player 0 with player 1 as opponent
          if (gameRoom.players[0] && gameRoom.players[0].socketId) {
            const player0Payload = {
              message: 'Both players are ready! Game is starting...',
              gameId: gameRoom.roomCode,
              roomCode: gameRoom.roomCode,
              betAmount: gameBetAmount,
              opponent: {
                userId: gameRoom.players[1].userId,
                username: gameRoom.players[1].username
              }
            };
            console.log(`Sending gameStart directly to player 0 (${gameRoom.players[0].username})`);
            io.to(gameRoom.players[0].socketId).emit('gameStart', player0Payload);
          }
          
          // Send to player 1 with player 0 as opponent
          if (gameRoom.players[1] && gameRoom.players[1].socketId) {
            const player1Payload = {
              message: 'Both players are ready! Game is starting...',
              gameId: gameRoom.roomCode,
              roomCode: gameRoom.roomCode,
              betAmount: gameBetAmount,
              opponent: {
                userId: gameRoom.players[0].userId,
                username: gameRoom.players[0].username
              }
            };
            console.log(`Sending gameStart directly to player 1 (${gameRoom.players[1].username})`);
            io.to(gameRoom.players[1].socketId).emit('gameStart', player1Payload);
          }
          
          // Also broadcast to the room as a fallback
          console.log('Broadcasting gameStart to room as fallback');
          io.to(gameId).emit('gameStart', {
            message: 'Both players are ready! Game is starting...',
            gameId: gameRoom.roomCode,
            roomCode: gameRoom.roomCode,
            betAmount: gameBetAmount
          });
          
          // Check if this game room is associated with a matched battle
          // Look for a battle where one of the players is a creator or opponent
          const matchedBattles = await getAllMatchedBattles();
          const matchedBattle = matchedBattles.find(battle => 
            (battle.creator && battle.creator.userId === gameRoom.players[0].userId) || 
            (battle.creator && battle.creator.userId === gameRoom.players[1].userId) ||
            (battle.opponent && battle.opponent.userId === gameRoom.players[0].userId) ||
            (battle.opponent && battle.opponent.userId === gameRoom.players[1].userId)
          );
          
          if (matchedBattle) {
            console.log(`Found matched battle ${matchedBattle.id}, moving to running status`);
            
            // Check if we've already processed wallet deductions for this game
            if (gameRoom.deductionsProcessed) {
              console.log('Wallet deductions already processed, skipping duplicate deductions');
            } else {
              // Now that both players are ready, deduct entry fees
              try {
                // Ensure entryFee is a number
                const entryFee = parseInt(matchedBattle.entryFee);
                console.log(`Attempting to deduct ${entryFee} from both players`);
                console.log('Creator ID:', matchedBattle.creator.userId);
                console.log('Opponent ID:', matchedBattle.opponent.userId);
                
                // Mark that deductions are being processed to prevent double deductions
                gameRoom.deductionsProcessed = true;
                gameRooms.set(gameId, gameRoom);
                
                // Check the correct function name and parameter order in Supabase
                console.log('Attempting to deduct from creator wallet with correct parameters');
              
                // Directly update wallet balance and record transaction
                // 1. Get current wallet balance
                const { data: creatorWallet, error: creatorWalletError } = await supabase
                  .from('wallets')
                  .select('balance')
                  .eq('user_id', matchedBattle.creator.userId)
                  .single();
              
                if (creatorWalletError) {
                  console.error('Error fetching creator wallet:', creatorWalletError);
                  throw new Error(`Failed to fetch creator wallet: ${creatorWalletError.message}`);
                }
                
                // Check if creator has enough balance
                if (creatorWallet.balance < entryFee) {
                  console.error(`Creator ${matchedBattle.creator.username} doesn't have enough balance. Has: ${creatorWallet.balance}, Needs: ${entryFee}`);
                  // Send an error message to the creator
                  if (matchedBattle.creator.socketId) {
                    io.to(matchedBattle.creator.socketId).emit('walletError', {
                      message: `You don't have enough balance to join this game. You need ₹${entryFee} but have ₹${creatorWallet.balance}.`
                    });
                  }
                  throw new Error(`Creator doesn't have enough balance`);
                }
                
                // 2. Update wallet balance
                const creatorNewBalance = creatorWallet.balance - entryFee;
                const { error: creatorUpdateError } = await supabase
                  .from('wallets')
                  .update({ balance: creatorNewBalance })
                  .eq('user_id', matchedBattle.creator.userId);
              
                if (creatorUpdateError) {
                  console.error('Error updating creator wallet:', creatorUpdateError);
                  throw new Error(`Failed to update creator wallet: ${creatorUpdateError.message}`);
                }
                
                // 3. Record transaction in wallet_transactions table
                const { error: creatorTransactionError } = await supabase
                  .from('wallet_transactions')
                  .insert({
                    user_id: matchedBattle.creator.userId,
                    amount: entryFee, // Store as positive amount
                    type: 'bet', // Using 'bet' which is an allowed type based on the schema
                    description: `Entry fee for Ludo game ${matchedBattle.id}`,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    balance_after: creatorNewBalance // Add balance after transaction
                  });
              
                if (creatorTransactionError) {
                  console.error('Error recording creator transaction:', creatorTransactionError);
                  // Don't throw here, just log the error
                } else {
                  console.log('Successfully recorded creator transaction');
                }
                
                console.log('Creator deduction completed. New balance:', creatorNewBalance);
                
                // Repeat for opponent
                // 1. Get current wallet balance
                const { data: opponentWallet, error: opponentWalletError } = await supabase
                  .from('wallets')
                  .select('balance')
                  .eq('user_id', matchedBattle.opponent.userId)
                  .single();
              
                if (opponentWalletError) {
                  console.error('Error fetching opponent wallet:', opponentWalletError);
                  throw new Error(`Failed to fetch opponent wallet: ${opponentWalletError.message}`);
                }
                
                // Check if opponent has enough balance
                if (opponentWallet.balance < entryFee) {
                  console.error(`Opponent ${matchedBattle.opponent.username} doesn't have enough balance. Has: ${opponentWallet.balance}, Needs: ${entryFee}`);
                  // Send an error message to the opponent
                  if (matchedBattle.opponent.socketId) {
                    io.to(matchedBattle.opponent.socketId).emit('walletError', {
                      message: `You don't have enough balance to join this game. You need ₹${entryFee} but have ₹${opponentWallet.balance}.`
                    });
                  }
                  throw new Error(`Opponent doesn't have enough balance`);
                }
                
                // 2. Update wallet balance
                const opponentNewBalance = opponentWallet.balance - entryFee;
                const { error: opponentUpdateError } = await supabase
                  .from('wallets')
                  .update({ balance: opponentNewBalance })
                  .eq('user_id', matchedBattle.opponent.userId);
              
                if (opponentUpdateError) {
                  console.error('Error updating opponent wallet:', opponentUpdateError);
                  throw new Error(`Failed to update opponent wallet: ${opponentUpdateError.message}`);
                }
                
                // 3. Record transaction in wallet_transactions table
                const { error: opponentTransactionError } = await supabase
                  .from('wallet_transactions')
                  .insert({
                    user_id: matchedBattle.opponent.userId,
                    amount: entryFee, // Store as positive amount
                    type: 'bet', // Using 'bet' which is an allowed type based on the schema
                    description: `Entry fee for Ludo game ${matchedBattle.id}`,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    balance_after: opponentNewBalance // Add balance after transaction
                  });
              
                if (opponentTransactionError) {
                  console.error('Error recording opponent transaction:', opponentTransactionError);
                  // Don't throw here, just log the error
                } else {
                  console.log('Successfully recorded opponent transaction');
                }
                
                console.log('Opponent deduction completed. New balance:', opponentNewBalance);
                console.log(`Successfully deducted ${entryFee} from both players and recorded transactions`);
              } catch (error) {
                console.error('Error deducting wallet balances:', error.message);
                // Continue with the game even if deduction fails
              }
            }
          }
        }
      }
    }
  });

  // Handle player disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from open battles if creator disconnects
    const newOpenBattles = await getAllOpenBattles();
    io.emit('openBattlesUpdate', { openBattles: newOpenBattles });
    
    // Handle running battles if a player disconnects
    const runningBattles = await getAllRunningBattles();
    let updated = false;
    for (const battle of runningBattles) {
      if ((battle.creator && battle.creator.socketId === socket.id) || 
          (battle.opponent && battle.opponent.socketId === socket.id)) {
        console.log(`Updating running battle ${battle.id} because player disconnected`);
        battle.status = 'abandoned';
        await addRunningBattle(battle); // Update the battle in Redis
        updated = true;
      }
    }
    
    if (updated) {
      const updatedRunningBattles = await getAllRunningBattles();
      io.emit('runningBattlesUpdate', { runningBattles: updatedRunningBattles });
    }
    
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
    // Log the full gameRoom received
    console.log('storeGameInSupabase received gameRoom:', JSON.stringify(gameRoom));
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

// Process referral rewards when a user wins a game
async function processReferralRewards(userId, winAmount, roomCode = '') {
  try {
    console.log(`Processing referral rewards for user ${userId} with win amount ${winAmount}`);
    
    // Skip if winAmount is too small
    if (winAmount <= 0) {
      console.log('Win amount is zero or negative, skipping referral rewards');
      return;
    }
    
    // Find if this user was referred by someone
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .select('referrer_id, referral_code, profiles(username)')
      .eq('referred_id', userId)
      .eq('status', 'pending')  // Only process for pending referrals
      .single();
    
    if (referralError) {
      console.log('No pending referral found for this user');
      return;
    }
    
    if (referralData) {
      const referrerId = referralData.referrer_id;
      const referralCode = referralData.referral_code;
      const referredUsername = referralData.profiles?.username || 'a user';
      
      // Get the referred user's username for the transaction description
      const { data: referredUserData, error: referredUserError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
        
      const referredName = referredUserError ? 'a user' : (referredUserData?.username || 'a user');
      
      // Calculate 3% of the win amount
      const rewardAmount = Math.floor(winAmount * 0.03);
      console.log(`Calculated reward: ${rewardAmount} (3% of ${winAmount})`);
      
      if (rewardAmount <= 0) {
        console.log('Calculated reward is too small, skipping');
        return;
      }
      
      // Begin a Supabase transaction
      // 1. Create a record in referral_rewards table
      const { data: rewardData, error: rewardError } = await supabase
        .from('referral_rewards')
        .insert([{
          referrer_id: referrerId,
          referred_id: userId,
          amount: rewardAmount,
          created_at: new Date().toISOString(),
          referral_code: referralCode,
          win_amount: winAmount,
          status: 'completed'
        }]);
      
      if (rewardError) {
        console.error('Error creating referral reward:', rewardError);
        return;
      }
      
      // 2. Update the referrer's wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', referrerId)
        .single();
      
      if (walletError) {
        console.error('Error fetching referrer wallet:', walletError);
        return;
      }
      
      const newBalance = walletData.balance + rewardAmount;
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', referrerId);
      
      if (updateError) {
        console.error('Error updating referrer wallet:', updateError);
        return;
      }
      
      // 3. Create a wallet transaction record for the referrer
      const transactionDescription = `Referral reward (3%) from ${referredName}'s win in match ${roomCode}`;
      
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: referrerId,
          amount: rewardAmount,
          type: 'referral',
          description: transactionDescription,
          status: 'approved',
          balance_after: newBalance,
          created_at: new Date().toISOString(),
          metadata: {
            referred_id: userId,
            referred_username: referredName,
            referral_code: referralCode,
            win_amount: winAmount,
            room_code: roomCode
          }
        }]);
      
      if (transactionError) {
        console.error('Error creating referrer transaction record:', transactionError);
        // Continue processing even if transaction record fails
      }
      
      // 4. Update the referral status to 'completed'
      const { error: statusError } = await supabase
        .from('referrals')
        .update({ status: 'completed' })
        .eq('referred_id', userId)
        .eq('referrer_id', referrerId);
      
      if (statusError) {
        console.error('Error updating referral status:', statusError);
        return;
      }
      
      console.log(`Successfully processed referral reward of ${rewardAmount} for referrer ${referrerId}`);
      return {
        success: true,
        referrerId,
        rewardAmount,
        newBalance
      };
    }
    return { success: false, reason: 'No referral data found' };
  } catch (error) {
    console.error('Error processing referral rewards:', error);
    return { success: false, error: error.message };
  }
}

// API endpoints
app.post('/api/verify-match', async (req, res) => {
  try {
    const { matchId, winnerId, winAmount } = req.body;
    
    if (!matchId || !winnerId || !winAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Processing match verification: Match ID ${matchId}, Winner ID ${winnerId}, Win Amount ${winAmount}`);
    
    // Verify the match exists
    const { data: matchData, error: matchError } = await supabase
      .from('match_verifications')
      .select('*, games(room_code, bet_amount)')
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Get game details for transaction description
    const roomCode = matchData.room_code;
    const betAmount = matchData.games?.bet_amount || 0;
    
    // Update match status to verified
    const { error: updateError } = await supabase
      .from('match_verifications')
      .update({ 
        status: 'verified', 
        verified_at: new Date().toISOString() 
      })
      .eq('id', matchId);
    
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update match status' });
    }
    
    // Update winner's wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', winnerId)
      .single();
    
    if (walletError) {
      return res.status(500).json({ error: 'Failed to fetch winner wallet' });
    }
    
    const newBalance = walletData.balance + winAmount;
    
    // Update wallet balance
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', winnerId);
    
    if (updateWalletError) {
      return res.status(500).json({ error: 'Failed to update winner wallet' });
    }
    
    // Create wallet transaction record for the winner
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: winnerId,
        amount: winAmount,
        type: 'win',
        description: `Win from match ${roomCode}`,
        status: 'approved',
        balance_after: newBalance,
        created_at: new Date().toISOString(),
        metadata: {
          match_id: matchId,
          room_code: roomCode,
          bet_amount: betAmount
        }
      }]);
    
    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Continue processing even if transaction record fails
    }
    
    // Process referral rewards
    await processReferralRewards(winnerId, winAmount, roomCode);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Match verified and rewards distributed',
      data: {
        winAmount,
        newBalance
      }
    });
  } catch (error) {
    console.error('Error verifying match:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 