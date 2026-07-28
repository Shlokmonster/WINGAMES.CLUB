import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function MatchVerification() {
    const [roomCode, setRoomCode] = useState('');
    const [hasLost, setHasLost] = useState(false);
    const [loadingLost, setLoadingLost] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [lastGameInfo, setLastGameInfo] = useState(null);
    const [validRoomCodes, setValidRoomCodes] = useState([]);
    const [roomCodeError, setRoomCodeError] = useState('');

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getCurrentUser();

        // Get last game info from localStorage
        const storedGameInfo = localStorage.getItem('lastGameInfo');
        if (storedGameInfo) {
            const gameInfo = JSON.parse(storedGameInfo);
            setLastGameInfo(gameInfo);
            setRoomCode(gameInfo.roomCode);
        }
    }, []);

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getCurrentUser();

        // Get last game info from localStorage
        const storedGameInfo = localStorage.getItem('lastGameInfo');
        if (storedGameInfo) {
            const gameInfo = JSON.parse(storedGameInfo);
            setLastGameInfo(gameInfo);
            setRoomCode(gameInfo.roomCode);
        }
    }, []);

    const handleScreenshotChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('File size should be less than 5MB');
                return;
            }
            setScreenshot(file);
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (hasLost) {
            toast.error('You have declared that you lost this game. You cannot submit a verification for this match.');
            return;
        }
        if (!roomCode || roomCode.trim().length < 4 || roomCode.trim().length > 12 || !screenshot || !user) {
            toast.error('Room code must be between 4 and 12 characters and all fields must be filled');
            return;
        }

        setUploading(true);
        try {
            // Upload screenshot to storage
            const fileExt = screenshot.name.split('.').pop();
            const fileName = `${user.id}/${roomCode}_${Date.now()}.${fileExt}`;
            const { error: uploadError, data } = await supabase.storage
                .from('match-screenshots')
                .upload(fileName, screenshot);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error('Failed to upload screenshot. Please try again.');
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('match-screenshots')
                .getPublicUrl(fileName);

            // Find existing game record in Supabase (created by the server)
            const searchRoomCode = (lastGameInfo?.roomCode || roomCode).trim().toUpperCase();
            const { data: gameData, error: gameError } = await supabase
                .from('games')
                .select('id, bet_amount')
                .eq('room_code', searchRoomCode)
                .order('created_at', { ascending: false });

            let gameId = null;
            let betAmount = lastGameInfo?.betAmount || 0;

            if (gameError) {
                console.error('Error fetching game:', gameError);
            } else if (gameData && gameData.length > 0) {
                gameId = gameData[0].id;
                betAmount = gameData[0].bet_amount || betAmount;
            } else {
                console.warn(`Game room not found for code: ${searchRoomCode}. Proceeding with null game_id.`);
            }

            // Store verification request in database
            const { error: dbError } = await supabase
                .from('match_verifications')
                .insert([{
                    user_id: user.id,
                    room_code: searchRoomCode,
                    screenshot_url: publicUrl,
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                    bet_amount: betAmount,
                    game_id: gameId // Link to the existing game, or null if not found
                }]);

            if (dbError) {
                console.error('Database error:', dbError);
                throw new Error('Failed to save verification. Please try again.');
            }

            toast.success('Match verification submitted successfully!');
            setRoomCode('');
            setScreenshot(null);
            setPreviewUrl(null);
            const fileInput = document.getElementById('screenshot');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to submit verification. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Handler for 'I lost the game'
    const handleILost = async () => {
        if (user && roomCode) {
            setLoadingLost(true);
            // First check if already declared
            const { data, error: fetchError } = await supabase
                .from('match_loser_confirmations')
                .select('id')
                .eq('user_id', user.id)
                .eq('room_code', roomCode)
                .maybeSingle();
            if (fetchError) {
                setLoadingLost(false);
                toast.error('Could not check previous loss declaration. Please try again.');
                return;
            }
            if (data) {
                setHasLost(true);
                setLoadingLost(false);
                toast.info('You have already declared that you lost this game.');
                return;
            }
            // If not declared, insert
            const { error } = await supabase
                .from('match_loser_confirmations')
                .insert([{ user_id: user.id, room_code: roomCode }]);
            setLoadingLost(false);
            if (!error) {
                setHasLost(true);
                toast.info('You have declared that you lost this game. You cannot submit a verification for this match.');
            } else {
                toast.error('Failed to declare loss. Please try again.');
            }
        }
    };

    return (
        <div className="match-verification-container">
            <ToastContainer position="top-center" />
            <div className="verification-card">
                <h2>Match Verification</h2>
                {lastGameInfo && (
                    <div className="game-info">
                        <p>Opponent: {lastGameInfo.opponent}</p>
                        <p>Bet Amount: ₹{lastGameInfo.betAmount}</p>
                        <p>Match Time: {new Date(lastGameInfo.timestamp).toLocaleString()}</p>
                    </div>
                )}
                <p className="verification-info">
                    Please upload a screenshot of your winning game along with the room code.
                </p>

                {hasLost && (
                    <div className="lost-message" style={{ color: 'red', marginBottom: 10 }}>
                        You have declared that you lost this game. You cannot submit a verification for this match.
                    </div>
                )}

                <button
                    type="button"
                    className="lost-btn"
                    onClick={handleILost}
                    disabled={hasLost || loadingLost}
                >
                    {loadingLost ? (
                        <span><FaSpinner className="spinner-icon" /> Saving...</span>
                    ) : hasLost ? 'You lost this game' : 'I lost the game'}
                </button>

                <form onSubmit={handleSubmit} className="verification-form">
                    <div className="form-group">
                        <label htmlFor="roomCode">Room Code</label>
                        <div className="input-with-error">
                            <input
                                type="text"
                                id="roomCode"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                readOnly={!!lastGameInfo}
                                placeholder="Room code (4-12 characters)"
                                maxLength={12}
                            />
                            {roomCodeError && (
                                <div className="error-message">{roomCodeError}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="screenshot">Game Screenshot</label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                id="screenshot"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="file-input"
                            />
                            <label htmlFor="screenshot" className="file-upload-label">
                                <FaUpload className="upload-icon" />
                                <span>{screenshot ? 'Change Screenshot' : 'Upload Screenshot'}</span>
                            </label>
                        </div>
                        {previewUrl && (
                            <div className="screenshot-preview">
                                <img src={previewUrl} alt="Screenshot preview" />
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        className="submit-btn" 
                        disabled={uploading || !roomCode || !screenshot || hasLost}
                    >
                        {uploading ? (
                            <>
                                <FaSpinner className="spinner-icon" />
                                Uploading...
                            </>
                        ) : (
                            'Submit Verification'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MatchVerification;