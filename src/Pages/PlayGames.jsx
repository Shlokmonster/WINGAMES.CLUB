import React, { useState, useEffect, useRef } from 'react';
import { FaDice, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';

const PlayGames = () => {
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [matchStatus, setMatchStatus] = useState('');
    const [gameRoom, setGameRoom] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const socketRef = useRef(null);
    const navigate = useNavigate();
    
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
        });
        
        socketRef.current.on('matchFound', (data) => {
            setIsMatchmaking(false);
            setMatchStatus(`Match found! Room code: ${data.roomCode}`);
            setGameRoom({
                roomCode: data.roomCode,
                opponent: data.opponent,
                isCreator: data.isCreator
            });
        });
        
        socketRef.current.on('playerReadyUpdate', (data) => {
            setOpponentReady(data.readyPlayers > 1);
            setMatchStatus(`${data.readyPlayers} of ${data.totalPlayers} players ready`);
        });
        
        socketRef.current.on('gameStarting', (data) => {
            setMatchStatus(data.message);
            // Redirect to game page after a short delay
            setTimeout(() => {
                navigate(`/game/${data.gameId}`);
            }, 2000);
        });
        
        socketRef.current.on('playerLeft', (data) => {
            setMatchStatus(data.message);
            // Reset game room after a delay
            setTimeout(() => {
                setGameRoom(null);
                setIsReady(false);
                setOpponentReady(false);
            }, 3000);
        });
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate]);

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
    };

    const startMatchmaking = () => {
        if (!selectedAmount || !user || !username) return;
        
        setIsMatchmaking(true);
        setMatchStatus('Searching for opponent...');
        
        // Join matchmaking queue
        socketRef.current.emit('joinMatchmaking', {
            userId: user.id,
            username,
            betAmount: selectedAmount
        });
    };

    const cancelMatchmaking = () => {
        setIsMatchmaking(false);
        setMatchStatus('');
        // The server will handle removing from queue on disconnect
    };

    const handleReady = () => {
        if (!gameRoom) return;
        
        setIsReady(true);
        socketRef.current.emit('playerReady', { roomCode: gameRoom.roomCode });
    };

    return (
        <div className="play-games-container">
            <div className="betting-dashboard">
                <h2>Select Bet Amount</h2>
                
                {!gameRoom && !isMatchmaking && (
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
                
                {gameRoom && !isReady && (
                    <div className="game-room-info">
                        <h3>Game Room: {gameRoom.roomCode}</h3>
                        <p>Opponent: {gameRoom.opponent.username}</p>
                        <p>{matchStatus}</p>
                        <button 
                            className="ready-btn"
                            onClick={handleReady}
                        >
                            I'm Ready
                        </button>
                    </div>
                )}
                
                {gameRoom && isReady && (
                    <div className="waiting-for-opponent">
                        <h3>Game Room: {gameRoom.roomCode}</h3>
                        <p>Opponent: {gameRoom.opponent.username}</p>
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