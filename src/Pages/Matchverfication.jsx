import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function MatchVerification() {
    const [roomCode, setRoomCode] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [lastGameInfo, setLastGameInfo] = useState(null);

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
        if (!roomCode || !screenshot || !user) {
            toast.error('Please fill in all fields');
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

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('match-screenshots')
                .getPublicUrl(fileName);

            // Store verification request in database
            const { error: dbError } = await supabase
                .from('match_verifications')
                .insert([{
                    user_id: user.id,
                    room_code: roomCode,
                    screenshot_url: publicUrl,
                    status: 'pending',
                    submitted_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            toast.success('Match verification submitted successfully!');
            setRoomCode('');
            setScreenshot(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to submit verification. Please try again.');
        } finally {
            setUploading(false);
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

                <form onSubmit={handleSubmit} className="verification-form">
                    <div className="form-group">
                        <label htmlFor="roomCode">Room Code</label>
                        <input
                            type="text"
                            id="roomCode"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Enter room code"
                            maxLength={6}
                        />
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
                        disabled={uploading || !roomCode || !screenshot}
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