import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaCheck, FaTimes, FaSpinner, FaEye, FaCoins } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Admin() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [completedVerifications, setCompletedVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user is an admin
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin || false);
          if (data?.is_admin) {
            fetchVerifications();
          }
        }
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  const fetchVerifications = async () => {
    try {
      // Fetch pending verifications
      const { data: pendingData, error: pendingError } = await supabase
        .from('match_verifications')
        .select(`
          id,
          user_id,
          room_code,
          screenshot_url,
          status,
          submitted_at,
          profiles (username),
          games (bet_amount, game_data)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (pendingError) throw pendingError;
      setPendingVerifications(pendingData || []);

      // Fetch completed verifications
      const { data: completedData, error: completedError } = await supabase
        .from('match_verifications')
        .select(`
          id,
          user_id,
          room_code,
          screenshot_url,
          status,
          submitted_at,
          profiles (username),
          games (bet_amount, game_data)
        `)
        .in('status', ['verified', 'rejected'])
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (completedError) throw completedError;
      setCompletedVerifications(completedData || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (match, winAmount) => {
    if (!match || !winAmount || winAmount <= 0) {
      toast.error('Please enter a valid win amount');
      return;
    }

    setProcessing(true);
    try {
      // Call the API endpoint to verify the match and process rewards
      const response = await fetch('/api/verify-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: match.id,
          winnerId: match.user_id,
          winAmount: parseFloat(winAmount)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify match');
      }

      toast.success('Match verified successfully!');
      setSelectedMatch(null);
      fetchVerifications();
    } catch (error) {
      console.error('Error verifying match:', error);
      toast.error(error.message || 'Failed to verify match');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (matchId) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('match_verifications')
        .update({ 
          status: 'rejected',
          verified_at: new Date().toISOString() 
        })
        .eq('id', matchId);

      if (error) throw error;

      toast.success('Match rejected successfully!');
      setSelectedMatch(null);
      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast.error('Failed to reject match');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <FaSpinner className="spinner" /> Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-center" />
      <h1 className="admin-title">Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Verifications ({pendingVerifications.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Verifications
        </button>
      </div>

      {/* Pending Verifications Tab */}
      {activeTab === 'pending' && (
        <div className="verification-list">
          {pendingVerifications.length === 0 ? (
            <div className="no-verifications">No pending verifications</div>
          ) : (
            pendingVerifications.map(match => (
              <div key={match.id} className="verification-item">
                <div className="verification-header">
                  <div>
                    <strong>Room:</strong> {match.room_code}
                  </div>
                  <div>
                    <strong>Player:</strong> {match.profiles?.username || 'Unknown'}
                  </div>
                  <div>
                    <strong>Submitted:</strong> {new Date(match.submitted_at).toLocaleString()}
                  </div>
                  {match.games?.bet_amount && (
                    <div>
                      <strong>Bet Amount:</strong> ₹{match.games.bet_amount}
                    </div>
                  )}
                </div>
                
                {match.screenshot_url && (
                  <div className="verification-screenshot">
                    <img src={match.screenshot_url} alt="Match Screenshot" />
                  </div>
                )}
                
                <div className="verification-actions">
                  <button 
                    className="view-btn"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <FaEye /> View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Verifications Tab */}
      {activeTab === 'completed' && (
        <div className="verification-list">
          {completedVerifications.length === 0 ? (
            <div className="no-verifications">No completed verifications</div>
          ) : (
            completedVerifications.map(match => (
              <div key={match.id} className={`verification-item ${match.status}`}>
                <div className="verification-header">
                  <div>
                    <strong>Room:</strong> {match.room_code}
                  </div>
                  <div>
                    <strong>Player:</strong> {match.profiles?.username || 'Unknown'}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span className={`status ${match.status}`}>
                      {match.status === 'verified' ? (
                        <><FaCheck /> Verified</>
                      ) : (
                        <><FaTimes /> Rejected</>
                      )}
                    </span>
                  </div>
                  <div>
                    <strong>Submitted:</strong> {new Date(match.submitted_at).toLocaleString()}
                  </div>
                </div>
                
                {match.screenshot_url && (
                  <div className="verification-screenshot">
                    <img src={match.screenshot_url} alt="Match Screenshot" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Verify Match</h2>
            
            <div className="match-details">
              <div><strong>Room Code:</strong> {selectedMatch.room_code}</div>
              <div><strong>Player:</strong> {selectedMatch.profiles?.username || 'Unknown'}</div>
              <div><strong>Submitted:</strong> {new Date(selectedMatch.submitted_at).toLocaleString()}</div>
              {selectedMatch.games?.bet_amount && (
                <div><strong>Bet Amount:</strong> ₹{selectedMatch.games.bet_amount}</div>
              )}
            </div>
            
            {selectedMatch.screenshot_url && (
              <div className="modal-screenshot">
                <img src={selectedMatch.screenshot_url} alt="Match Screenshot" />
              </div>
            )}
            
            <div className="win-amount-input">
              <label htmlFor="winAmount">
                <FaCoins /> Win Amount (₹):
              </label>
              <input 
                type="number" 
                id="winAmount" 
                placeholder="Enter win amount"
                min="1"
                defaultValue={selectedMatch.games?.bet_amount ? selectedMatch.games.bet_amount * 2 : ''}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="reject-btn" 
                onClick={() => handleReject(selectedMatch.id)}
                disabled={processing}
              >
                {processing ? <FaSpinner className="spinner" /> : <FaTimes />} Reject
              </button>
              <button 
                className="verify-btn" 
                onClick={() => {
                  const winAmount = document.getElementById('winAmount').value;
                  handleVerify(selectedMatch, winAmount);
                }}
                disabled={processing}
              >
                {processing ? <FaSpinner className="spinner" /> : <FaCheck />} Verify
              </button>
              <button 
                className="close-btn" 
                onClick={() => setSelectedMatch(null)}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
