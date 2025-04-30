import React, { useState } from 'react';
import supabase from '../../lib/supabase';

export default function UserSearch() {
  const [userId, setUserId] = useState('');
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newBalance, setNewBalance] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    setWallet(null);
    setTransactions([]);
    setUpdateMsg('');
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    setWallet(walletData);

    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setTransactions(txs || []);
  }

  async function handleBalanceUpdate(e) {
    e.preventDefault();
    setUpdateMsg('');
    if (!wallet) return;
    const oldBalance = Number(wallet.balance);
    const newBal = Number(newBalance);
    if (isNaN(newBal)) {
      setUpdateMsg('Invalid balance value.');
      return;
    }
    const diff = newBal - oldBalance;
    if (diff === 0) {
      setUpdateMsg('No change in balance.');
      return;
    }
    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBal })
      .eq('user_id', userId);
    if (error) {
      setUpdateMsg('Failed to update balance.');
    } else {
      // Log the admin adjustment in wallet_transactions
      await supabase.from('wallet_transactions').insert([
        {
          user_id: userId,
          type: 'admin_adjust',
          amount: Math.abs(diff),
          balance_after: newBal,
          description: `Admin adjustment: ${diff > 0 ? 'added' : 'deducted'} ₹${Math.abs(diff)}`,
          status: 'completed'
        }
      ]);
      setUpdateMsg('Balance updated successfully!');
      setWallet({ ...wallet, balance: newBal });
      setNewBalance('');
    }
  }

  return (
    <div>
      <h2>User Search</h2>
      <form onSubmit={handleSearch} className="admin-user-search">
        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>
      {wallet && (
        <div>
          <h3>Wallet</h3>
          <p>Balance: ₹{wallet.balance}</p>
          <form onSubmit={handleBalanceUpdate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <input
              type="number"
              placeholder="Set new balance"
              value={newBalance}
              onChange={e => setNewBalance(e.target.value)}
              min="0"
              required
              style={{ width: '120px' }}
            />
            <button type="submit">Update Balance</button>
          </form>
          {updateMsg && <div style={{ color: updateMsg.includes('success') ? '#4ecdc4' : '#dc3545', marginTop: '0.3rem' }}>{updateMsg}</div>}
        </div>
      )}
      {transactions.length > 0 && (
        <div>
          <h3>Transactions</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.type}</td>
                  <td>₹{tx.amount}</td>
                  <td>₹{tx.balance_after}</td>
                  <td>{tx.description}</td>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 