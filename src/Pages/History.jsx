import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FaCoins, FaGamepad, FaSpinner, FaCheck, FaClock, FaTimes } from 'react-icons/fa';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'matches'

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch from the wallet_transactions table
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (txError) {
          console.error('Error fetching transactions:', txError);
        } else {
          setTransactions(txData || []);
        }
        
        // Fetch match verification history
        const { data: matchData, error: matchError } = await supabase
          .from('match_verifications')
          .select(`
            id,
            room_code,
            screenshot_url,
            status,
            submitted_at,
            games (
              bet_amount,
              status,
              game_data
            )
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });
        
        if (matchError) {
          console.error('Error fetching match history:', matchError);
        } else {
          setMatchHistory(matchData || []);
        }
      }
      setLoading(false);
    };
    fetchUserAndHistory();
  }, []);

  return (
    <div className="history-page">
      <div className="history-tabs">
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <FaCoins /> Transactions
        </button>
        <button 
          className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <FaGamepad /> Match History
        </button>
      </div>
      
      {loading ? (
        <div className="history-loading">
          <FaSpinner className="spinner" /> Loading...
        </div>
      ) : (
        <>
          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="tab-content">
              <h2 className="history-title">Transaction History</h2>
              <ul className="history-list">
                {transactions.length === 0 && <li className="history-empty">No transactions found.</li>}
                {transactions.map(tx => (
                  <li key={tx.id} className={`history-item ${tx.type}`}>
                    <div className="history-row">
                      <span className="history-type">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                      <span className="history-amount">{
                        tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'
                      }₹{tx.amount}</span>
                    </div>
                    <div className="history-meta">
                      <span>{new Date(tx.created_at).toLocaleString()}</span>
                      <span>Bal: ₹{tx.balance_after || 'N/A'}</span>
                    </div>
                    {tx.description && <div className="history-desc">{tx.description}</div>}
                    {tx.status && (
                      <div className="history-status">
                        Status: <span style={{
                          color: tx.status === 'approved' ? '#4ecdc4' : tx.status === 'rejected' ? '#dc3545' : '#FFD700',
                          fontWeight: 600
                        }}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <div className="tab-content">
              <h2 className="history-title">Match History</h2>
              <ul className="match-history-list">
                {matchHistory.length === 0 && <li className="history-empty">No match history found.</li>}
                {matchHistory.map(match => (
                  <li key={match.id} className="match-item">
                    <div className="match-header">
                      <div className="match-room">
                        Room: <strong>{match.room_code}</strong>
                      </div>
                      <div className="match-status">
                        {match.status === 'pending' && (
                          <span className="status pending"><FaClock /> Pending</span>
                        )}
                        {match.status === 'verified' && (
                          <span className="status verified"><FaCheck /> Verified</span>
                        )}
                        {match.status === 'rejected' && (
                          <span className="status rejected"><FaTimes /> Rejected</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="match-details">
                      <div className="match-date">
                        Submitted: {new Date(match.submitted_at).toLocaleString()}
                      </div>
                      {/* Verified date will be shown once the column is added */}
                      {match.games && match.games.bet_amount && (
                        <div className="match-bet">
                          Bet Amount: ₹{match.games.bet_amount}
                        </div>
                      )}
                    </div>
                    
                    {match.screenshot_url && (
                      <div className="match-screenshot">
                        <img src={match.screenshot_url} alt="Match Screenshot" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History; 