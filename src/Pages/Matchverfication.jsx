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
        if (!roomCode || roomCode.length !== 8 || !screenshot || !user) {
            toast.error('Room code must be exactly 8 characters and all fields must be filled');
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

            // First create a game record
            const { data: gameData, error: gameError } = await supabase
                .from('games')
                .insert([{
                    room_code: lastGameInfo?.roomCode || roomCode,
                    bet_amount: lastGameInfo?.betAmount || 0,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    game_type: 'ludo',
                    game_data: {
                        players: [{
                            user_id: user.id,
                            username: user.user_metadata?.username || 'Player'
                        }]
                    }
                }])
                .select();

            if (gameError) {
                console.error('Game creation error:', gameError);
                throw new Error('Failed to create game record. Please try again.');
            }

            // Store verification request in database with game_id
            const { error: dbError } = await supabase
                .from('match_verifications')
                .insert([{
                    user_id: user.id,
                    room_code: lastGameInfo?.roomCode || roomCode,
                    screenshot_url: publicUrl,
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                    bet_amount: lastGameInfo?.betAmount || 0,
                    game_id: gameData[0].id // Link to the created game
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
                                value={lastGameInfo?.roomCode || ''}
                                readOnly
                                placeholder="Room code (8 characters)"
                                maxLength={8}
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