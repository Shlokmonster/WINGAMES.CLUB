import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function MatchVerificationAdmin() {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userProfiles, setUserProfiles] = useState({});

    useEffect(() => {
        checkAdmin();
        fetchVerifications();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || data?.role !== 'admin') {
                window.location.href = '/';
                return;
            }
            setUser(user);
        } else {
            window.location.href = '/login';
        }
    };

    const fetchVerifications = async () => {
        try {
            // Fetch verifications without trying to join with games
            const { data, error } = await supabase
                .from('match_verifications')
                .select(`
                    id,
                    user_id,
                    room_code,
                    screenshot_url,
                    status,
                    submitted_at,
                    reviewed_at,
                    reviewer_id,
                    reviewer_notes,
                    bet_amount
                `)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            // Fetch user profiles for all unique user_ids
            const userIds = [...new Set(data.map(v => v.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);

            const profileMap = {};
            profiles?.forEach(profile => {
                profileMap[profile.id] = profile.username;
            });

            setUserProfiles(profileMap);
            setVerifications(data);
        } catch (error) {
            toast.error('Failed to fetch verifications');
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (id, status, notes = '') => {
        try {
            // Use status directly without conversion
            const { error } = await supabase
                .from('match_verifications')
                .update({
                    status: status,
                    reviewer_notes: notes,
                    reviewed_at: new Date().toISOString(),
                    reviewer_id: user.id
                })
                .eq('id', id);

            if (error) throw error;

            if (status === 'verified') {
                const verification = verifications.find(v => v.id === id);
                if (verification?.bet_amount) {
                    await processWinnerReward(verification.user_id, verification.bet_amount);
                }
            }

            const statusMessage = status === 'verified' ? 'approved' : status;
            toast.success(`Verification ${statusMessage} successfully`);
            fetchVerifications();
        } catch (error) {
            toast.error('Failed to update verification');
            console.error('Error:', error);
        }
    };

    const processWinnerReward = async (userId, betAmount) => {
        try {
            // Calculate win amount as 1.95x the designated amount
            const winAmount = betAmount * 1.95;

            // Update winner's wallet
            const { error: walletError } = await supabase.rpc('update_wallet_balance', {
                user_id: userId,
                amount: winAmount
            });

            if (walletError) throw walletError;

            // Log transaction
            const { error: txError } = await supabase
                .from('wallet_transactions')
                .insert([{
                    user_id: userId,
                    type: 'win',
                    amount: winAmount,
                    description: 'Game win reward',
                    status: 'completed'
                }]);

            if (txError) throw txError;

            // Process referral reward if applicable
            await processReferralReward(userId, winAmount);
        } catch (error) {
            console.error('Error processing reward:', error);
            toast.error('Failed to process winner reward');
        }
    };

    const processReferralReward = async (userId, winAmount) => {
        try {
            // Get the referrer's ID
            const { data: referralData, error: referralError } = await supabase
                .from('referrals')
                .select('referrer_id')
                .eq('referred_id', userId)
                .single();

            if (referralError || !referralData) return;

            // Calculate referral reward (3% of win amount)
            const referralReward = (winAmount * 3) / 100;

            // Update referrer's wallet
            const { error: walletError } = await supabase.rpc('update_wallet_balance', {
                user_id: referralData.referrer_id,
                amount: referralReward
            });

            if (walletError) return;

            // Log referral transaction
            await supabase
                .from('wallet_transactions')
                .insert([{
                    user_id: referralData.referrer_id,
                    type: 'referral_bonus',
                    amount: referralReward,
                    description: `Referral bonus for user ${userId}'s win`,
                    status: 'completed'
                }]);
        } catch (error) {
            console.error('Error processing referral reward:', error);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <FaSpinner className="spinner-icon" />
                <p>Loading verifications...</p>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <ToastContainer position="top-center" />
            <div className="admin-header">
                <h2>Match Verification Admin Panel</h2>
                <p>Total Pending: {verifications.filter(v => v.status === 'pending').length}</p>
            </div>

            <div className="verifications-grid">
                {verifications.map(verification => (
                    <div key={verification.id} className={`verification-card ${verification.status}`}>
                        <div className="card-header">
                            <span className="room-code">Room: {verification.room_code}</span>
                            <span className={`status ${verification.status}`}>
                                {verification.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="screenshot-container">
                            <img 
                                src={verification.screenshot_url} 
                                alt="Game Screenshot"
                                onClick={() => window.open(verification.screenshot_url, '_blank')}
                            />
                        </div>

                        <div className="verification-details">
                            <p>Player: {userProfiles[verification.user_id] || 'Unknown'}</p>
                            <p>Designated Amount: ₹{verification.bet_amount || 0}</p>
                            <p>Submitted: {new Date(verification.submitted_at).toLocaleString()}</p>
                        </div>

                        {verification.status === 'pending' && (
                            <div className="action-buttons">
                                <textarea
                                    placeholder="Add reviewer notes..."
                                    className="reviewer-notes"
                                />
                                <div className="button-group">
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleVerification(
                                            verification.id,
                                            'verified',
                                            document.querySelector('.reviewer-notes')?.value
                                        )}
                                    >
                                        <FaCheck /> Approve
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleVerification(
                                            verification.id,
                                            'rejected',
                                            document.querySelector('.reviewer-notes')?.value
                                        )}
                                    >
                                        <FaTimes /> Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {verification.status !== 'pending' && verification.reviewer_notes && (
                            <div className="reviewer-notes-display">
                                <p><strong>Reviewer Notes:</strong></p>
                                <p>{verification.reviewer_notes}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
