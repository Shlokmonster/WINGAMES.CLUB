import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FaWallet, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TABS = ['wallet', 'deposit', 'withdraw'];

const Wallet = () => {
  const [tab, setTab] = useState('wallet');
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchBalance(user.id);
    };
    fetchUser();
  }, []);

  const fetchBalance = async (userId) => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (data) setBalance(data.balance);
  };

  return (
    <div className="wallet-tabs-container">
      <div className="wallet-tabs">
        <button className={tab === 'wallet' ? 'active' : ''} onClick={() => setTab('wallet')}>
          <FaWallet /> Wallet
        </button>
        <button className={tab === 'deposit' ? 'active' : ''} onClick={() => setTab('deposit')}>
          Deposit
        </button>
        <button className={tab === 'withdraw' ? 'active' : ''} onClick={() => setTab('withdraw')}>
          Withdraw
        </button>
        <button className="wallet-tabs-transactions" onClick={() => navigate('/history')}>
          <FaHistory /> Transactions
        </button>
      </div>
      {tab === 'wallet' && (
        <div className="wallet-balance-card">
          <div className="wallet-balance-title">Wallet Balance</div>
          <div className="wallet-balance-subtitle">Your current account balance</div>
          <div className="wallet-balance-amount">₹{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className="wallet-balance-actions">
            <button className="wallet-balance-btn deposit" onClick={() => setTab('deposit')}>Deposit</button>
            <button className="wallet-balance-btn withdraw" onClick={() => setTab('withdraw')} disabled>Withdraw</button>
          </div>
          <div className="wallet-balance-note">KYC approval required for withdrawals</div>
        </div>
      )}
      {tab === 'deposit' && <DepositForm user={user} onSuccess={() => { setTab('wallet'); fetchBalance(user.id); }} />}
      {tab === 'withdraw' && <WithdrawForm user={user} balance={balance} onSuccess={() => { setTab('wallet'); fetchBalance(user.id); }} />}
    </div>
  );
};

// ----------------- Deposit Form -----------------
const UPI_ID = 'wingames@okaxis'; // Your UPI ID
const QR_IMAGE_URL = '/your-qr-image.png'; // Place your QR image in public folder

const DepositForm = ({ user, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProofChange = (e) => setProof(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!amount || !upiId || !transactionId) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    let proofUrl = null;
    if (proof) {
      const { data, error: uploadError } = await supabase.storage
        .from('deposit-proofs')
        .upload(`proofs/${Date.now()}_${proof.name}`, proof);
      if (uploadError) {
        setError('Failed to upload proof.');
        setLoading(false);
        return;
      }
      proofUrl = data?.path ? supabase.storage.from('deposit-proofs').getPublicUrl(data.path).publicUrl : null;
    }
    const { error: insertError } = await supabase
      .from('deposit_requests')
      .insert([{
        user_id: user.id,
        amount: Number(amount),
        upi_id: upiId,
        transaction_id: transactionId,
        proof_url: proofUrl,
        status: 'pending'
      }]);
    if (insertError) {
      setError('Failed to submit deposit request.');
      setLoading(false);
      return;
    }

    // Log transaction in wallet_transactions
    const { error: txError } = await supabase.from('wallet_transactions').insert([{
      user_id: user.id,
      type: 'deposit',
      amount: Number(amount),
      balance_after: null,
      description: `Deposit request via UPI: ${upiId}`,
      status: 'pending'
    }]);
    if (txError) {
      setError('Failed to log deposit transaction.');
      setLoading(false);
      return;
    }

    setSuccess('Deposit request submitted! Our team will verify and credit your wallet soon.');
    setAmount('');
    setUpiId('');
    setTransactionId('');
    setProof(null);
    if (onSuccess) onSuccess();
    setLoading(false);
  };

  return (
    <form className="deposit-form-card" onSubmit={handleSubmit}>
      <div className="deposit-form-title">Deposit Funds</div>
      <div className="deposit-form-subtitle">Add money to your wallet to play games</div>
      <label>Amount (₹)</label>
      <input
        type="number"
        className="deposit-input"
        placeholder="Enter amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min="1"
        required
      />
      <div className="deposit-quick-amounts">
        {[100, 500, 1000, 2000, 5000].map(val => (
          <button type="button" key={val} className="deposit-quick-btn" onClick={() => setAmount(val)}>
            ₹{val}
          </button>
        ))}
      </div>
      <label>UPI ID Used for Payment</label>
      <input
        type="text"
        className="deposit-input"
        placeholder="e.g. 9876543210@upi"
        value={upiId}
        onChange={e => setUpiId(e.target.value)}
        required
      />
      <label>Transaction ID</label>
      <input
        type="text"
        className="deposit-input"
        placeholder="Enter transaction ID"
        value={transactionId}
        onChange={e => setTransactionId(e.target.value)}
        required
      />
      <label>Proof of Payment (Optional)</label>
      <input
        type="file"
        accept="image/png, image/jpeg"
        className="deposit-input"
        onChange={handleProofChange}
      />
      {error && <div className="deposit-error">{error}</div>}
      {success && <div className="deposit-success">{success}</div>}
      <button className="deposit-submit-btn" type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Deposit Request'}
      </button>
      <div className="deposit-qr-section">
        <img src={QR_IMAGE_URL} alt="UPI QR" className="deposit-qr-img" />
        <div className="deposit-qr-upi">UPI ID: <b>{UPI_ID}</b></div>
        <div className="deposit-instructions">
          <b>Payment Instructions:</b>
          <ol>
            <li>Send payment to UPI ID: <b>{UPI_ID}</b></li>
            <li>Enter the exact amount you've chosen above</li>
            <li>Add your email in the payment description</li>
            <li>Upload screenshot as proof of payment (optional)</li>
            <li>Submit the form with your UPI ID and transaction ID</li>
          </ol>
        </div>
      </div>
    </form>
  );
};

// ----------------- Withdraw Form -----------------
const WithdrawForm = ({ user, balance, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || !upiId) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    if (withdrawAmount > balance) {
      setError('Withdrawal amount exceeds available balance.');
      setLoading(false);
      return;
    }

    // 1. Deduct from wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .update({ balance: balance - withdrawAmount })
      .eq('user_id', user.id)
      .select()
      .single();

    if (walletError) {
      setError('Failed to update wallet balance.');
      setLoading(false);
      return;
    }

    // 2. Log transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        balance_after: walletData.balance,
        description: `Withdrawal request to ${upiId}`,
        status: 'pending'
      }]);

    if (txError) {
      setError('Failed to log transaction.');
      setLoading(false);
      return;
    }

    // 3. Create withdraw request
    const { error: insertError } = await supabase
      .from('withdraw_requests')
      .insert([{
        user_id: user.id,
        amount: withdrawAmount,
        upi_id: upiId,
        status: 'pending'
      }]);

    if (insertError) {
      setError('Failed to submit withdrawal request.');
    } else {
      setSuccess('Withdrawal request submitted! Our team will process it soon.');
      setAmount('');
      setUpiId('');
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form className="withdraw-form-card" onSubmit={handleSubmit}>
      <div className="withdraw-form-title">Withdraw Funds</div>
      <div className="withdraw-form-subtitle">Withdraw money from your wallet to your bank account or UPI</div>
      <div className="withdraw-balance-box">
        <span>Available Balance</span>
        <span className="withdraw-balance-amount">₹{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      </div>
      <label>Withdrawal Amount (₹)</label>
      <input
        type="number"
        className="withdraw-input"
        placeholder="Enter amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min="1"
        required
      />
      <div className="withdraw-quick-amounts">
        {[100, 500, 1000, 2000, 5000].map(val => (
          <button type="button" key={val} className="withdraw-quick-btn" onClick={() => setAmount(val)}>
            ₹{val}
          </button>
        ))}
      </div>
      <label>UPI ID</label>
      <input
        type="text"
        className="withdraw-input"
        placeholder="e.g. 9876543210@upi"
        value={upiId}
        onChange={e => setUpiId(e.target.value)}
        required
      />
      {error && <div className="withdraw-error">{error}</div>}
      {success && <div className="withdraw-success">{success}</div>}
      <button className="withdraw-submit-btn" type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
      </button>
      <div className="withdraw-note">
        Note: Withdrawal requests are processed within 24 hours during business days.<br />
        A small processing fee may apply for certain withdrawal methods.
      </div>
    </form>
  );
};

export default Wallet; 