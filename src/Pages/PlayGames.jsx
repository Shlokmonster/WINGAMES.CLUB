import React, { useState, useEffect, useRef } from 'react';
import { FaDice, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MATCHMAKING_TIMEOUT = 120000; // 120 seconds

const PlayGames = () => {
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [matchStatus, setMatchStatus] = useState('');
    const [gameRoom, setGameRoom] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [showRoomInput, setShowRoomInput] = useState(false);
    const [error, setError] = useState('');
    const socketRef = useRef(null);
    const matchmakingTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const [walletBalance, setWalletBalance] = useState(0);
    
    const betAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                
                // Get username from profiles
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                
                if (data && !error) {
                    setUsername(data.username);
                }
            }
        };
        
        getCurrentUser();
        
        // Initialize Socket.IO connection
        socketRef.current = io('http://localhost:3001');
        
        // Socket event listeners
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
        
        socketRef.current.on('playerReadyUpdate', (data) => {
            console.log('Received playerReadyUpdate:', data);
            // Update ready status based on the server response
            if (data.readyStatus && user) {
                const isPlayerReady = data.readyStatus[user.id] || false;
                setIsReady(isPlayerReady);
                
                // Find opponent's ready status
                const opponentId = gameRoom?.opponent?.userId;
                if (opponentId) {
                    const isOpponentReady = data.readyStatus[opponentId] || false;
                    setOpponentReady(isOpponentReady);
                    console.log('Ready status updated - You:', isPlayerReady, 'Opponent:', isOpponentReady);
                }
            }
            
            setMatchStatus(`${data.readyPlayers} of ${data.totalPlayers} players ready`);
            toast.info(`${data.readyPlayers} of ${data.totalPlayers} players ready`);
        });
        
        socketRef.current.on('gameStart', (data) => {
            console.log('Game starting:', data);
            setMatchStatus('Both players ready! Game starting...');
            toast.success('Both players ready! Game starting...');
            
            // Navigate to game page after a short delay
            setTimeout(() => {
                navigate(`/game/${data.gameId}`);
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
            setGameRoom(prev => ({
                ...prev,
                roomCode: data.roomCode,
                betAmount: prev.betAmount
            }));
            setShowRoomInput(true);
            setMatchStatus(data.message);
            toast.info(data.message);
        });
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate]);

    useEffect(() => {
        if (!isMatchmaking && matchmakingTimeoutRef.current) {
            clearTimeout(matchmakingTimeoutRef.current);
        }
    }, [isMatchmaking]);

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
    }, [user]);

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
    };

    const startMatchmaking = () => {
        if (!selectedAmount || !user || !username) return;
        if (selectedAmount > walletBalance) {
            toast.error('Insufficient wallet balance for this bet.');
            return;
        }
        setIsMatchmaking(true);
        setMatchStatus('Searching for opponent...');
        socketRef.current.emit('joinMatchmaking', {
            userId: user.id,
            username,
            betAmount: selectedAmount
        });
        // Start the 120s timer
        if (matchmakingTimeoutRef.current) clearTimeout(matchmakingTimeoutRef.current);
        matchmakingTimeoutRef.current = setTimeout(() => {
            if (isMatchmaking) {
                setIsMatchmaking(false);
                setMatchStatus('');
                toast.error('No player available for matching for the amount you have chosen.');
            }
        }, MATCHMAKING_TIMEOUT);
    };

    const cancelMatchmaking = () => {
        setIsMatchmaking(false);
        setMatchStatus('');
        if (matchmakingTimeoutRef.current) clearTimeout(matchmakingTimeoutRef.current);
    };

    const handleReady = () => {
        if (!gameRoom || !gameRoom.roomCode) return;
        
        setIsReady(true);
        socketRef.current.emit('playerReady', { roomCode: gameRoom.roomCode });
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
            <div className="betting-dashboard">
                <h2>Select Bet Amount</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                {!gameRoom && !isMatchmaking && !showRoomInput && (
                    <>
                        <div className="bet-amounts-grid">
                            {betAmounts.map((amount) => (
                                <button
                                    key={amount}
                                    className={`bet-amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                                    onClick={() => handleAmountSelect(amount)}
                                >
                                    <FaDice className="dice-icon" />
                                    <span>₹{amount}</span>
                                </button>
                            ))}
                        </div>
                        
                        {selectedAmount && (
                            <div className="selected-bet-info">
                                <p>Selected Bet: ₹{selectedAmount}</p>
                                <button 
                                    className="start-game-btn"
                                    onClick={startMatchmaking}
                                    disabled={!user || !username}
                                >
                                    {!user || !username ? 'Please sign in first' : 'Find Opponent'}
                                </button>
                            </div>
                        )}
                    </>
                )}
                
                {showRoomInput && gameRoom && (
                    <div className="room-input-container">
                        <h3>{isCreator ? 'Create Room Code' : 'Enter Room Code'}</h3>
                        <p>Opponent: {gameRoom.opponent.username}</p>
                        <p>Bet Amount: ₹{gameRoom.betAmount}</p>
                        <input 
                            type="text" 
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            placeholder="Enter room code"
                            maxLength={6}
                        />
                        <div className="room-actions">
                            {isCreator ? (
                                <button 
                                    className="create-room-btn"
                                    onClick={createRoomCode}
                                    disabled={!roomCode || roomCode.length < 3}
                                >
                                    Create Room
                                </button>
                            ) : (
                                <button 
                                    className="join-room-btn"
                                    onClick={joinWithRoomCode}
                                    disabled={!roomCode || roomCode.length < 3}
                                >
                                    Join Room
                                </button>
                            )}
                            <button 
                                className="back-btn"
                                onClick={() => {
                                    setShowRoomInput(false);
                                    setRoomCode('');
                                }}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
                
                {isMatchmaking && (
                    <div className="matchmaking-status">
                        <FaSpinner className="spinner-icon" />
                        <p>{matchStatus}</p>
                        <button 
                            className="cancel-btn"
                            onClick={cancelMatchmaking}
                        >
                            Cancel
                        </button>
                    </div>
                )}
                
                {gameRoom && gameRoom.roomCode && !isReady && (
                    <div className="game-room-info">
                        <h3>Game Room: {gameRoom.roomCode}</h3>
                        {gameRoom.opponent ? (
                            <p>Opponent: {gameRoom.opponent.username}</p>
                        ) : (
                            <p>Waiting for opponent to join...</p>
                        )}
                        <p>{matchStatus}</p>
                        <button 
                            className="ready-btn"
                            onClick={handleReady}
                            disabled={
                                !gameRoom ||
                                !gameRoom.players ||
                                gameRoom.players.length < 2 ||
                                isReady
                            }
                        >
                            I'm Ready
                        </button>
                    </div>
                )}
                
                {gameRoom && isReady && (
                    <div className="waiting-for-opponent">
                        <h3>Game Room: {gameRoom.roomCode}</h3>
                        <p>Opponent: {gameRoom.opponent?.username || 'Waiting...'}</p>
                        <p>{matchStatus}</p>
                        <div className="ready-status">
                            <div className={`player-status ${isReady ? 'ready' : ''}`}>
                                You: {isReady ? 'Ready' : 'Not Ready'}
                            </div>
                            <div className={`player-status ${opponentReady ? 'ready' : ''}`}>
                                Opponent: {opponentReady ? 'Ready' : 'Not Ready'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayGames; 