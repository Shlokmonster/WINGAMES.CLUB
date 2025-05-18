import React, { useState, useEffect, useRef } from 'react';
import { FaDice, FaSpinner, FaInfoCircle, FaCoins, FaTrophy, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsInfoCircleFill } from 'react-icons/bs';

const MATCHMAKING_TIMEOUT = 120000; // 120 seconds

const PlayGames = () => {
    // User and wallet state
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    
    // Game room state
    const [gameRoom, setGameRoom] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [showRoomInput, setShowRoomInput] = useState(false);
    const [matchStatus, setMatchStatus] = useState('');
    
    // Battle creation state
    const [battleAmount, setBattleAmount] = useState('');
    const [battleComment, setBattleComment] = useState('');
    const [openBattles, setOpenBattles] = useState([]);
    const [runningBattles, setRunningBattles] = useState([]);
    const [isCreatingBattle, setIsCreatingBattle] = useState(false);
    const [isJoiningBattle, setIsJoiningBattle] = useState(false);
    const [joiningBattleId, setJoiningBattleId] = useState(null);
    const [showRules, setShowRules] = useState(false);
    
    // Utility state
    const [error, setError] = useState('');
    const socketRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                console.log('Current user set:', user.id);
                
                // Get username from profiles
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                
                if (data && !error) {
                    setUsername(data.username);
                    console.log('Username set:', data.username);
                }
            }
        };
        
        getCurrentUser();
        
        // Initialize Socket.IO connection
        socketRef.current = io('http://localhost:3001');
        
        // Original matchmaking event listeners
        socketRef.current.on('waitingForMatch', (data) => {
            setMatchStatus(data.message);
            toast.info(data.message);
        });
        
        socketRef.current.on('matchFound', (data) => {
            setIsMatchmaking(false);
            setIsCreator(data.isCreator);
            
            if (data.isCreator) {
                setMatchStatus(`Match found! You will create the room code.`);
                toast.success('Match found! You will create the room code.');
                setShowRoomInput(true);
            } else {
                setMatchStatus(`Match found! Waiting for opponent to create room code...`);
                toast.info('Match found! Waiting for opponent to create room code...');
            }
            
            setGameRoom({
                opponent: data.opponent,
                betAmount: data.betAmount || selectedAmount
            });
        });
        
        socketRef.current.on('roomCreated', (data) => {
            setMatchStatus(data.message);
            toast.info(data.message);
            setGameRoom(prev => ({
                ...prev,
                roomCode: data.roomCode,
                betAmount: prev.betAmount
            }));
        });
        
        socketRef.current.on('opponentJoined', (data) => {
            setMatchStatus(`Opponent ${data.opponent.username} has joined the room!`);
            toast.success(`Opponent ${data.opponent.username} has joined the room!`);
            setGameRoom(prev => ({
                ...prev,
                opponent: data.opponent,
                players: [
                    { userId: user?.id, username: username },
                    { userId: data.opponent.userId, username: data.opponent.username }
                ],
                betAmount: prev.betAmount
            }));
        });
        
        // New battle system event listeners
        socketRef.current.on('openBattlesUpdate', (data) => {
            setOpenBattles(data.openBattles || []);
        });
        
        socketRef.current.on('runningBattlesUpdate', (data) => {
            setRunningBattles(data.runningBattles || []);
        });
        
        socketRef.current.on('battleCreated', (data) => {
            toast.success('Battle created successfully!');
            setIsCreatingBattle(false);
            setBattleAmount('');
            setBattleComment('');
        });
        
        socketRef.current.on('battleMatched', (data) => {
            toast.success('Joined battle successfully!');
            setIsJoiningBattle(false);
            setJoiningBattleId(null);
            
            // Set game room with battle data to start room code exchange process
            const battle = data.battle;
            
            // Debug battle data
            console.log('BATTLE MATCHED DATA:', battle);
            console.log('Current user ID:', user?.id);
            console.log('Opponent ID:', battle.opponent?.userId);
            console.log('Viewer Role:', battle.viewerRole);
            console.log('Is Room Code Creator?', battle.isRoomCodeCreator);
            
            // Use the viewerRole from the server to determine if player is creator
            const isPlayerCreator = battle.viewerRole === 'creator';
            // Use isRoomCodeCreator to determine who should create the room code
            const isRoomCodeCreator = battle.isRoomCodeCreator === true;
            
            console.log('Is player creator?', isPlayerCreator);
            console.log('Is room code creator?', isRoomCodeCreator);
            
            // The opponent is already correctly set by the server
            const opponent = battle.opponent;
            console.log('Opponent is:', opponent);
            
            // Verify opponent is not the same as current user
            if (opponent.userId === user?.id) {
                console.error('ERROR: Opponent is the same as current user!');
                toast.error('Error: Opponent data is incorrect');
                return;
            }
            
            console.log('Setting game room with opponent:', opponent);
            
            setGameRoom({
                roomCode: '',
                betAmount: battle.entryFee,
                opponent: opponent,
                codeShared: false, // Track if code has been shared yet
                battleId: battle.id, // Store battle ID for reference
                isRoomCodeCreator: isRoomCodeCreator // Store who should create the room code
            });
            
            setIsCreator(isPlayerCreator);
            setShowRoomInput(true);
            
            if (isRoomCodeCreator) {
                toast.info('Create a room in Ludo King app and share the code');
            } else {
                toast.info('Wait for your opponent to create and share a room code');
            }
        });
        
        socketRef.current.on('battleDeleted', (data) => {
            toast.info('Battle deleted');
        });
        
        socketRef.current.on('battleError', (data) => {
            toast.error(data.message);
            setIsCreatingBattle(false);
            setIsJoiningBattle(false);
            setJoiningBattleId(null);
        });
        
        socketRef.current.on('gameCreated', (data) => {
            setRoomCode(data.roomCode);
            setGameRoom({
                roomCode: data.roomCode,
                betAmount: data.betAmount,
                opponent: data.opponent
            });
            toast.success('Game created! Get ready to play.');
        });
        
        socketRef.current.on('roomJoined', (data) => {
            setMatchStatus(`You have joined the room!`);
            toast.success('You have joined the room!');
            setGameRoom(prev => ({
                ...prev,
                roomCode: data.roomCode,
                opponent: data.opponent,
                players: [
                    { userId: user?.id, username: username },
                    { userId: data.opponent.userId, username: data.opponent.username }
                ],
                betAmount: prev.betAmount
            }));
        });
        
        // Handle wallet error messages
        socketRef.current.on('walletError', (data) => {
            console.log('Received wallet error:', data);
            toast.error(data.message);
            // Reset ready status if there was a wallet error
            setIsReady(false);
        });
        
        // Handle the new direct ready status updates
        socketRef.current.on('directReadyUpdate', (data) => {
            console.log('Received directReadyUpdate:', data);
            
            // Only process if this update is for our current room
            if (gameRoom && data.roomCode === gameRoom.roomCode && user) {
                console.log('Processing direct ready update for room:', data.roomCode);
                
                // Determine which player is the current user and which is the opponent
                let currentPlayerInfo, opponentInfo;
                
                if (data.currentPlayer.userId === user.id) {
                    currentPlayerInfo = data.currentPlayer;
                    opponentInfo = data.opponent;
                    console.log('Current user is the player who just updated ready status');
                } else if (data.opponent.userId === user.id) {
                    currentPlayerInfo = data.opponent;
                    opponentInfo = data.currentPlayer;
                    console.log('Current user is the opponent of the player who just updated ready status');
                } else {
                    console.log('Could not identify current user in the update data');
                    return; // Skip processing if we can't identify the current user
                }
                
                // Update the ready status for both players
                console.log('Setting isReady to:', currentPlayerInfo.isReady);
                setIsReady(currentPlayerInfo.isReady);
                
                console.log('Setting opponentReady to:', opponentInfo.isReady);
                setOpponentReady(opponentInfo.isReady);
                
                // Show toast notification if opponent is ready
                if (opponentInfo.isReady) {
                    toast.info(`${opponentInfo.username} is ready!`, {
                        position: 'top-center',
                        autoClose: 3000
                    });
                }
                
                // Update the game room with the latest info
                setGameRoom(prevGameRoom => ({
                    ...prevGameRoom,
                    opponent: {
                        ...prevGameRoom.opponent,
                        userId: opponentInfo.userId,
                        username: opponentInfo.username,
                        isReady: opponentInfo.isReady
                    },
                    allPlayersReady: data.allPlayersReady,
                    lastReadyUpdate: new Date().getTime() // Add a timestamp to force re-render
                }));
                
                // If all players are ready, show a more prominent notification
                if (data.allPlayersReady) {
                    console.log('All players are ready!');
                    toast.success('Both players are ready! Preparing to start the game...', {
                        position: 'top-center',
                        autoClose: 3000
                    });
                }
            }
        });
        
        socketRef.current.on('playerReadyUpdate', (data) => {
            console.log('Received playerReadyUpdate:', data);
            console.log('Current user:', user?.id);
            console.log('Current gameRoom:', gameRoom);
            console.log('Ready status from server:', data.readyStatus);
            console.log('Detailed player info:', data.players);
            
            // Only process if this update is for our current room
            if (gameRoom && data.roomCode === gameRoom.roomCode) {
                console.log('This update is for our current room');
                
                // Update ready status based on the server response
                if (data.readyStatus && user) {
                    console.log('Processing ready status update with data:', data.readyStatus);
                    console.log('Current user ID:', user.id);
                    console.log('All user IDs in ready status:', Object.keys(data.readyStatus));
                    
                    // Check if current user is ready
                    const isPlayerReady = data.readyStatus[user.id] || false;
                    setIsReady(isPlayerReady);
                    console.log('Setting isReady to:', isPlayerReady);
                    
                    // Find opponent's ready status from the detailed player info
                    if (data.players && data.players.length === 2) {
                        const currentPlayerInfo = data.players.find(p => p.userId === user.id);
                        const opponentInfo = data.players.find(p => p.userId !== user.id);
                        
                        if (opponentInfo) {
                            console.log('Found opponent in detailed player info:', opponentInfo);
                            setOpponentReady(opponentInfo.isReady);
                            
                            // Update opponent info in game room
                            setGameRoom(prevGameRoom => ({
                                ...prevGameRoom,
                                opponent: {
                                    ...prevGameRoom.opponent,
                                    userId: opponentInfo.userId,
                                    username: opponentInfo.username,
                                    isReady: opponentInfo.isReady
                                },
                                lastReadyUpdate: new Date().getTime() // Add a timestamp to force re-render
                            }));
                        }
                    } else {
                        // Fallback to the old method if detailed player info is not available
                        const opponentId = gameRoom?.opponent?.userId;
                        console.log('Looking for opponent with ID:', opponentId);
                        
                        if (opponentId && data.readyStatus.hasOwnProperty(opponentId)) {
                            const isOpponentReady = data.readyStatus[opponentId] || false;
                            console.log('Setting opponentReady to:', isOpponentReady, 'for opponent ID:', opponentId);
                            setOpponentReady(isOpponentReady);
                        } else {
                            console.log('Cannot find opponent ID in readyStatus, trying fallback method');
                            
                            // Fallback: find any other user ID that's not the current user
                            const otherUserId = Object.keys(data.readyStatus).find(id => id !== user.id);
                            if (otherUserId) {
                                const isOtherUserReady = data.readyStatus[otherUserId] || false;
                                console.log('Fallback: Setting opponentReady to:', isOtherUserReady, 'for other user ID:', otherUserId);
                                setOpponentReady(isOtherUserReady);
                            } else {
                                console.error('Could not find any opponent ID in ready status data');
                            }
                        }
                    }
                }
                
                // Check if both players are ready
                const allPlayersReady = data.readyPlayers === data.totalPlayers;
                if (allPlayersReady) {
                    console.log('ALL PLAYERS READY - INITIATING REDIRECT SEQUENCE');
                    setMatchStatus('Both players ready! Redirecting to match verification...');
                    toast.success('Both players ready! Please verify your match result.');
                    
                    // Store game info and redirect to match verification
                    // This ensures BOTH players get redirected, not just the one who receives gameStart
                    const gameInfo = {
                        roomCode: gameRoom.roomCode,
                        betAmount: gameRoom.betAmount,
                        opponent: gameRoom.opponent?.username,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('Storing game info and redirecting:', gameInfo);
                    localStorage.setItem('lastGameInfo', JSON.stringify(gameInfo));
                    
                    // Navigate to match verification page after a short delay
                    setTimeout(() => {
                        console.log('Executing navigation to match verification...');
                        navigate('/match-verification');
                    }, 2000);
                } else {
                    setMatchStatus(`${data.readyPlayers} of ${data.totalPlayers} players ready`);
                    toast.info(`${data.readyPlayers} of ${data.totalPlayers} players ready`);
                }
            } else {
                console.log('Ignoring update for different room');
            }
        });
        

        
        socketRef.current.on('gameStart', (data) => {
            console.log('Game starting with data:', data);
            console.log('Current gameRoom state:', gameRoom);
            console.log('Current user:', user?.id, username);
            
            // Force both players to be ready in the UI
            setIsReady(true);
            setOpponentReady(true);
            
            setMatchStatus('Both players ready! Redirecting to match verification...');
            toast.success('Both players ready! Please verify your match result.');
            
            // Ensure bet amount is a number
            let betAmount = parseInt(data.betAmount);
            if (isNaN(betAmount) && gameRoom) {
                betAmount = parseInt(gameRoom.betAmount);
            }
            if (isNaN(betAmount)) {
                betAmount = 0;
            }
            
            console.log('Using bet amount for game info:', betAmount);
            
            // Get the latest game room data
            const gameInfo = {
                roomCode: data.roomCode || gameRoom?.roomCode,
                betAmount: betAmount,
                opponent: data.opponent?.username || gameRoom?.opponent?.username,
                timestamp: new Date().toISOString()
            };
            
            console.log('Storing game info:', gameInfo);
            localStorage.setItem('lastGameInfo', JSON.stringify(gameInfo));

            // Navigate to match verification page after a short delay
            console.log('Starting navigation timeout...');
            setTimeout(() => {
                console.log('Executing navigation to match verification...');
                navigate('/match-verification');
            }, 2000);
        });
        
        socketRef.current.on('playerLeft', (data) => {
            setMatchStatus(data.message);
            toast.error(data.message);
            setTimeout(() => {
                setGameRoom(null);
                setIsReady(false);
                setOpponentReady(false);
                setShowRoomInput(false);
                setRoomCode('');
            }, 3000);
        });
        
        socketRef.current.on('roomError', (data) => {
            setError(data.message);
            toast.error(data.message);
            setTimeout(() => setError(''), 5000);
        });
        
        // Listen for roomCodeAvailable (opponent receives room code in real-time)
        socketRef.current.on('roomCodeAvailable', (data) => {
            console.log('Received roomCodeAvailable:', data);
            setRoomCode(data.roomCode);
            setGameRoom(prev => ({
                ...prev,
                roomCode: data.roomCode,
                betAmount: prev.betAmount,
                codeShared: true // Mark that code has been shared
            }));
            setShowRoomInput(true);
            setMatchStatus('Room code received. Join this room in Ludo King app, then click Ready.');
            toast.success('Room code received! Join this room in Ludo King app, then click I\'M READY.');
        });
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate]);

    // No longer needed since we're removing the matchmaking system

    useEffect(() => {
        // Fetch wallet balance
        const fetchWallet = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .single();
            if (data) setWalletBalance(data.balance);
        };
        fetchWallet();
        
        // Initial fetch of battles when user is loaded
        if (socketRef.current && user) {
            socketRef.current.emit('getOpenBattles');
            socketRef.current.emit('getRunningBattles');
        }
    }, [user]);

    // Battle system functions
    const handleCreateBattle = () => {
        if (!user) {
            toast.error('Please sign in to create a battle');
            return;
        }
        
        if (!battleAmount || isNaN(battleAmount) || parseInt(battleAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        const entryFee = parseInt(battleAmount);
        
        if (entryFee > walletBalance) {
            toast.error('Insufficient wallet balance');
            return;
        }
        
        setIsCreatingBattle(true);
        socketRef.current.emit('createBattle', {
            userId: user.id,
            username,
            entryFee,
            comment: battleComment
        });
    };
    
    const handleJoinBattle = (battleId) => {
        if (!user) {
            toast.error('Please sign in to join a battle');
            return;
        }
        
        setIsJoiningBattle(true);
        setJoiningBattleId(battleId);
        socketRef.current.emit('joinBattle', {
            battleId,
            userId: user.id,
            username
        });
    };
    
    const handleDeleteBattle = (battleId) => {
        if (!user) {
            toast.error('Please sign in to delete a battle');
            return;
        }
        
        socketRef.current.emit('deleteBattle', {
            battleId,
            userId: user.id
        });
    };

    const handleReady = () => {
        if (!gameRoom || !gameRoom.roomCode) return;
        
        console.log('Sending playerReady event with roomCode:', gameRoom.roomCode);
        setIsReady(true);
        socketRef.current.emit('playerReady', { 
            roomCode: gameRoom.roomCode,
            userId: user?.id,
            username: username
        });
    };
    
    const createRoomCode = () => {
        if (!gameRoom || !user || !username || !roomCode) return;
        console.log('EMIT createRoomCode:', {
            userId: user.id,
            username,
            roomCode: roomCode.toUpperCase(),
            opponentId: gameRoom.opponent.userId,
            opponentSocketId: gameRoom.opponent.socketId,
            betAmount: gameRoom.betAmount
        });
        socketRef.current.emit('createRoomCode', {
            userId: user.id,
            username,
            roomCode: roomCode.toUpperCase(),
            opponentId: gameRoom.opponent.userId,
            opponentSocketId: gameRoom.opponent.socketId,
            betAmount: gameRoom.betAmount
        });
        
        // Update local game room state to show code has been shared
        setGameRoom(prev => ({
            ...prev,
            roomCode: roomCode.toUpperCase(),
            codeShared: true
        }));
    };
    
    const joinWithRoomCode = () => {
        if (!gameRoom || !user || !username || !roomCode) return;
        
        socketRef.current.emit('joinWithRoomCode', {
            userId: user.id,
            username,
            roomCode: roomCode.toUpperCase()
        });
    };

    return (
        <div className="play-games-container">
            <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            
            {/* Create Battle Section */}
            <div className="create-battle-section">
                <h2 className="section-title">CREATE A BATTLE!</h2>
                <div className="battle-form">
                    <input
                        type="number"
                        className="battle-input"
                        placeholder="Amount"
                        value={battleAmount}
                        onChange={(e) => setBattleAmount(e.target.value)}
                        disabled={isCreatingBattle}
                    />
                    <input
                        type="text"
                        className="battle-input"
                        placeholder="Enter your comment"
                        value={battleComment}
                        onChange={(e) => setBattleComment(e.target.value)}
                        disabled={isCreatingBattle}
                    />
                    <button
                        className="set-battle-btn"
                        onClick={handleCreateBattle}
                        disabled={isCreatingBattle || !battleAmount || !user}
                    >
                        {isCreatingBattle ? <FaSpinner className="spinner-icon" /> : 'SET'}
                    </button>
                </div>
            </div>
            
            {/* Open Battles Section */}
            <div className="battles-section">
                <div className="section-header">
                    <h2 className="section-title">Open Battles</h2>
                    <button className="rules-btn" onClick={() => setShowRules(!showRules)}>
                        <span>RULES</span> <BsInfoCircleFill />
                    </button>
                </div>
                
                {/* Rules Modal - Now positioned to the side */}
                {showRules && (
                    <div className="rules-modal">
                        <div className="rules-content">
                            <h3>Game Rules</h3>
                            <ul>
                                <li>Create a battle with your desired bet amount</li>
                                <li>Wait for another player to join your battle</li>
                                <li>The creator will create a room in Ludo King app</li>
                                <li>Share the room code with your opponent</li>
                                <li>Both players must click 'Ready' to start the game</li>
                                <li>Winner must submit a screenshot for verification</li>
                            </ul>
                            <button className="close-rules-btn" onClick={() => setShowRules(false)}>
                                <span>Close</span>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* List of Open Battles */}
                <div className="battles-section">
                    <h3 className="section-title"><FaDice /> Open Battles</h3>
                    <div className="battles-list">
                        {openBattles.length === 0 ? (
                            <div className="no-battles">
                                <FaInfoCircle />
                                <p>No open battles available</p>
                                <span>Create a battle to get started!</span>
                            </div>
                        ) : (
                            openBattles.map((battle) => (
                                <div key={battle.id} className="battle-card">
                                    <div className="battle-header">
                                        <h3>{battle.creator?.username || 'Unknown'} <span className="vs-text">vs</span> {battle.opponent?.username || 'Unknown'}</h3>
                                    </div>
                                    <div className="battle-details">
                                        <div className="battle-fee">
                                            <span className="fee-label"><FaCoins /> Entry Fee</span>
                                            <span className="fee-amount">₹{battle.entryFee}</span>
                                        </div>
                                        <div className="battle-prize">
                                            <span className="prize-label"><FaTrophy /> Prize</span>
                                            <span className="prize-amount">₹{battle.prize}</span>
                                        </div>
                                        <div className="battle-actions">
                                            {battle.creator.userId === user?.id ? (
                                                <button
                                                    className="delete-battle-btn"
                                                    onClick={() => handleDeleteBattle(battle.id)}
                                                >
                                                    DELETE BATTLE
                                                </button>
                                            ) : (
                                                <button
                                                    className="join-battle-btn"
                                                    onClick={() => handleJoinBattle(battle.id)}
                                                    disabled={isJoiningBattle}
                                                >
                                                    {isJoiningBattle && joiningBattleId === battle.id ? (
                                                        <FaSpinner className="spinner" />
                                                    ) : (
                                                        'JOIN BATTLE'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Running Battles Section */}
            <div className="battles-section running-battles">
                <h3 className="section-title"><FaDice className="spinning-dice" /> Running Battles</h3>
                <div className="battles-list">
                    {runningBattles.length === 0 ? (
                        <div className="no-battles">
                            <FaInfoCircle />
                            <p>No running battles</p>
                            <span>Join or create a battle to get started!</span>
                        </div>
                    ) : (
                         runningBattles.map((battle) => (
                            <div key={battle.id} className="battle-card">
                                <div className="battle-header">
                                    <h3>{battle.creator?.username || 'Unknown'} <span className="vs-text">vs</span> {battle.opponent?.username || 'Unknown'}</h3>
                                </div>
                                <div className="battle-details">
                                    <div className="battle-fee">
                                        <span className="fee-label"><FaCoins /> Entry Fee</span>
                                        <span className="fee-amount">₹{battle.entryFee}</span>
                                    </div>
                                    <div className="battle-prize">
                                        <span className="prize-label"><FaTrophy /> Prize</span>
                                        <span className="prize-amount">₹{battle.prize}</span>
                                    </div>
                                    <div className="battle-status">
                                        <span className="status-label">Status</span>
                                        <span className="status-value active">In Progress</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* Room Code Input Modal */}
            {showRoomInput && gameRoom && (
                <div className="room-modal">
                    <div className="room-modal-content">
                        {console.log('RENDER - isCreator:', isCreator)}
                        {console.log('RENDER - gameRoom:', gameRoom)}
                        {console.log('RENDER - codeShared:', gameRoom.codeShared)}
                        <h3>{isCreator ? 'Create Room Code' : 'Enter Room Code'}</h3>
                        <p>Opponent: {gameRoom.opponent?.username}</p>
                        <p>Bet Amount: ₹{gameRoom.betAmount}</p>
                        
                        {/* ROOM CODE CREATOR VIEW */}
                        {gameRoom.isRoomCodeCreator && (
                            <>
                                {/* Room code creator before sharing code */}
                                {!gameRoom.codeShared && (
                                    <>
                                        <div className="creator-instructions">
                                            <p>1. Open Ludo King app</p>
                                            <p>2. Create a room</p>
                                            <p>3. Enter the room code below</p>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value)}
                                            placeholder="ENTER ROOM CODE"
                                            maxLength={6}
                                            className="room-code-input"
                                        />
                                        <div className="room-actions">
                                            <button 
                                                className="create-room-btn"
                                                onClick={createRoomCode}
                                                disabled={!roomCode || roomCode.length < 3}
                                            >
                                                Share Code
                                            </button>
                                        </div>
                                    </>
                                )}
                                
                                {/* Room code creator after sharing code */}
                                {gameRoom.codeShared && (
                                    <>
                                        <p>You've shared the room code. Wait for opponent to join.</p>
                                        <div className="received-code">
                                            {roomCode}
                                        </div>
                                        <div className="room-actions">
                                            <button 
                                                className="ready-btn"
                                                onClick={handleReady}
                                            >
                                                I'M READY
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        
                        {/* ROOM CODE RECEIVER VIEW */}
                        {!gameRoom.isRoomCodeCreator && (
                            <>
                                {/* Room code receiver waiting for code */}
                                {!gameRoom.codeShared && (
                                    <p>Your opponent is creating a room in Ludo King. Waiting for room code...</p>
                                )}
                                
                                {/* Room code receiver after receiving code */}
                                {gameRoom.codeShared && (
                                    <>
                                        <p>Room code received. Join this room in Ludo King app.</p>
                                        <div className="received-code">
                                            {roomCode}
                                        </div>
                                        <div className="room-actions">
                                            <button 
                                                className="ready-btn"
                                                onClick={handleReady}
                                            >
                                                I'M READY
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Ready Status Modal */}
            {gameRoom && gameRoom.roomCode && (isReady || opponentReady) && (
                <div className="ready-modal">
                    <div className="ready-modal-content">
                        <h3>Game Room: {gameRoom.roomCode}</h3>
                        <p>Opponent: {gameRoom.opponent?.username || 'Waiting...'}</p>
                        <p>{matchStatus}</p>
                        
                        <div className="ready-status">
                            <div className={`player-status ${isReady ? 'ready' : ''}`}>
                                You: {isReady ? 'Ready ✓' : 'Not Ready'}
                            </div>
                            <div className={`player-status ${opponentReady ? 'ready' : ''}`}>
                                Opponent: {opponentReady ? 'Ready ✓' : 'Not Ready'}
                            </div>
                        </div>
                        
                        {!isReady && (
                            <button 
                                className="ready-btn"
                                onClick={handleReady}
                            >
                                I'm Ready
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayGames; 