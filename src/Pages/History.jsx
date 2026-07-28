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
        
        // Fetch match verifications submitted by this user (claims of wins / past wins)
        const { data: verificationsData, error: verificationsError } = await supabase
          .from('match_verifications')
          .select(`
            id,
            room_code,
            screenshot_url,
            status,
            submitted_at,
            reviewer_notes,
            game_id,
            bet_amount
          `)
          .eq('user_id', user.id);
        
        if (verificationsError) console.error('Error fetching verifications:', verificationsError);

        // Fetch match loser confirmations submitted by this user (claims of losses / past losses)
        const { data: loserConfirmationsData, error: loserConfirmationsError } = await supabase
          .from('match_loser_confirmations')
          .select(`
            id,
            room_code,
            created_at
          `)
          .eq('user_id', user.id);

        if (loserConfirmationsError) console.error('Error fetching loser confirmations:', loserConfirmationsError);

        // Fetch all game participations (new games recorded in game_players)
        const { data: participationsData, error: participationsError } = await supabase
          .from('game_players')
          .select(`
            game_id,
            games (
              id,
              room_code,
              bet_amount,
              status,
              created_at,
              winner_id,
              game_data
            )
          `)
          .eq('user_id', user.id);

        if (participationsError) console.error('Error fetching participations:', participationsError);

        const verifications = verificationsData || [];
        const loserConfirmations = loserConfirmationsData || [];
        const participations = participationsData || [];

        // Combine all data sources to ensure backwards compatibility with older tests
        const matchMap = new Map();

        // 1. Add game players records (for new games)
        participations.forEach(part => {
          const game = part.games;
          if (!game) return;
          const key = game.room_code.trim().toUpperCase();
          
          let matchStatus = 'active';
          if (game.status === 'completed') {
            if (game.winner_id === user.id) {
              matchStatus = 'verified';
            } else if (game.winner_id) {
              matchStatus = 'lost';
            } else {
              matchStatus = 'completed';
            }
          } else if (game.status === 'abandoned') {
            matchStatus = 'abandoned';
          }

          matchMap.set(key, {
            id: game.id,
            room_code: game.room_code,
            screenshot_url: null,
            status: matchStatus,
            submitted_at: game.created_at,
            reviewer_notes: null,
            games: {
              bet_amount: game.bet_amount,
              status: game.status,
              game_data: game.game_data
            }
          });
        });

        // 2. Merge user-submitted verifications (claims of wins / past wins)
        verifications.forEach(ver => {
          const key = ver.room_code.trim().toUpperCase();
          const existing = matchMap.get(key);

          if (existing) {
            existing.screenshot_url = ver.screenshot_url;
            existing.reviewer_notes = ver.reviewer_notes;
            if (existing.status === 'active' || existing.status === 'completed') {
              existing.status = ver.status; // pending/verified/rejected
            }
          } else {
            matchMap.set(key, {
              id: ver.id,
              room_code: ver.room_code,
              screenshot_url: ver.screenshot_url,
              status: ver.status,
              submitted_at: ver.submitted_at,
              reviewer_notes: ver.reviewer_notes,
              games: {
                bet_amount: ver.bet_amount || 0,
                status: ver.status === 'verified' ? 'completed' : 'pending',
                game_data: null
              }
            });
          }
        });

        // 3. Merge user loss declarations (claims of losses / past losses)
        loserConfirmations.forEach(loser => {
          const key = loser.room_code.trim().toUpperCase();
          const existing = matchMap.get(key);

          if (existing) {
            existing.status = 'lost';
          } else {
            matchMap.set(key, {
              id: loser.id,
              room_code: loser.room_code,
              screenshot_url: null,
              status: 'lost',
              submitted_at: loser.created_at,
              reviewer_notes: null,
              games: {
                bet_amount: 0,
                status: 'completed',
                game_data: null
              }
            });
          }
        });

        const mergedMatches = Array.from(matchMap.values())
          .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

        setMatchHistory(mergedMatches);
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
                          <span className="status verified"><FaCheck /> Won</span>
                        )}
                        {match.status === 'lost' && (
                          <span className="status rejected" style={{ backgroundColor: 'rgba(220, 53, 69, 0.15)', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.3)' }}><FaTimes /> Lost</span>
                        )}
                        {match.status === 'rejected' && (
                          <span className="status rejected"><FaTimes /> Rejected</span>
                        )}
                        {match.status === 'active' && (
                          <span className="status pending" style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)' }}><FaClock /> Active</span>
                        )}
                        {match.status === 'abandoned' && (
                          <span className="status rejected" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#aaa', border: '1px solid rgba(255, 255, 255, 0.2)' }}><FaTimes /> Abandoned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="match-details">
                      <div className="match-date">
                        Date: {new Date(match.submitted_at).toLocaleString()}
                      </div>
                      {/* Verified date will be shown once the column is added */}
                      {match.games?.bet_amount && (
                        <div className="match-bet">
                          Bet Amount: ₹{match.games.bet_amount}
                        </div>
                      )}
                      {match.status === 'verified' && (
                        <div className="match-win" style={{ color: '#4ecdc4', fontWeight: 600 }}>
                          Outcome: Won & Credited
                        </div>
                      )}
                      {match.status === 'lost' && (
                        <div className="match-win" style={{ color: '#dc3545', fontWeight: 600 }}>
                          Outcome: Lost & Debited
                        </div>
                      )}
                      {match.reviewer_notes && (
                        <div className="match-notes">
                          Notes: {match.reviewer_notes}
                        </div>
                      )}
                      {match.games && (
                        <div className="game-info">
                          Game Status: {match.games.status}
                          {match.games.game_data && match.games.game_data.players && (
                            <div className="players-info">
                              Players: {match.games.game_data.players.map(p => p.username).join(', ')}
                            </div>
                          )}
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