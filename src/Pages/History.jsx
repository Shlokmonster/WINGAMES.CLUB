import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setTransactions(data);
      }
      setLoading(false);
    };
    fetchUserAndHistory();
  }, []);

  return (
    <div className="history-page">
      <h2 className="history-title">Transaction History</h2>
      {loading ? (
        <div className="history-loading">Loading...</div>
      ) : (
        <ul className="history-list">
          {transactions.length === 0 && <li className="history-empty">No transactions found.</li>}
          {transactions.map(tx => (
            <li key={tx.id} className={`history-item ${tx.type}`}>
              <div className="history-row">
                <span className="history-type">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                <span className="history-amount">{tx.type === 'deposit' ? '+' : tx.type === 'win' ? '+' : '-'}₹{tx.amount}</span>
              </div>
              <div className="history-meta">
                <span>{new Date(tx.created_at).toLocaleString()}</span>
                <span>Bal: ₹{tx.balance_after}</span>
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
      )}
    </div>
  );
};

export default History; 