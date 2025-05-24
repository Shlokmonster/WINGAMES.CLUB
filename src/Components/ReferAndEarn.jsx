import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaGift, FaUsers, FaCoins, FaShareAlt, FaCopy, FaWhatsapp } from 'react-icons/fa';

const ReferAndEarn = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await fetchProfile(user.id);
          await fetchReferrals(user.id);
        }
      } catch (error) {
        console.error('Error initializing referral system:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        
        // If profile exists but has no referral code, generate one
        if (!data.referral_code) {
          await generateReferralCode(userId);
          return; // generateReferralCode will handle setting state
        }
        
        setReferralCode(data.referral_code);
        // Create referral link
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/auth?ref=${data.referral_code}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    }
  };
  
  const generateReferralCode = async (userId) => {
    try {
      // Generate a random referral code
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Try to update the profile with the new code
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ referral_code: randomCode })
        .eq('id', userId)
        .select('referral_code')
        .single();
      
      if (error) throw error;
      
      if (data && data.referral_code) {
        setReferralCode(data.referral_code);
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/auth?ref=${data.referral_code}`);
      }
    } catch (error) {
      console.error('Error generating referral code:', error.message);
      // Fallback to a local code if database update fails
      const localCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      setReferralCode(localCode);
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/auth?ref=${localCode}`);
    }
  };

  const fetchReferrals = async (userId) => {
    try {
      // First check if the referrals table exists
      const { error: tableCheckError } = await supabase
        .from('referrals')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If the table doesn't exist or there's a schema error, handle gracefully
      if (tableCheckError && (tableCheckError.message.includes('does not exist') || 
          tableCheckError.message.includes('relationship') || 
          tableCheckError.message.includes('schema'))) {
        console.log('Referral system not yet set up in database');
        setReferrals([]);
        setRewards(0);
        return;
      }
      
      // If the table exists, try to fetch data with simpler query first
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (error) throw error;

      if (data) {
        // For each referral, get the username separately to avoid join issues
        const referralsWithUsernames = await Promise.all(data.map(async (referral) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', referral.referred_id)
              .single();
              
            return {
              ...referral,
              referred: profileData || { username: 'Unknown User' }
            };
          } catch (e) {
            return {
              ...referral,
              referred: { username: 'Unknown User' }
            };
          }
        }));
        
        setReferrals(referralsWithUsernames);
        
        // Calculate total rewards with error handling
        try {
          const { data: rewardsData, error: rewardsError } = await supabase
            .from('referral_rewards')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'credited');

          if (!rewardsError && rewardsData) {
            const totalRewards = rewardsData.reduce((sum, item) => sum + item.amount, 0);
            setRewards(totalRewards);
          }
        } catch (rewardsError) {
          console.log('Rewards table not yet available');
          setRewards(0);
        }
      }
    } catch (error) {
      console.error('Error fetching referrals:', error.message);
      setReferrals([]);
      setRewards(0);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareOnWhatsApp = () => {
    const message = `Join me on WinGames Club and get ₹50 bonus! Use my referral code: ${referralCode}. Download now: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return <div className="refer-loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="refer-container">
        <div className="refer-card">
          <h2>Please log in to access the referral program</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="refer-container">
      <div className="refer-header">
        <h1>Refer & Earn</h1>
        <p className="refer-subtitle">Invite friends and earn rewards!</p>
      </div>

      <div className="refer-card rewards-summary">
        <div className="rewards-icon">
          <FaGift className="icon" />
        </div>
        <div className="rewards-content">
          <h3>How It Works</h3>
          <ul className="rewards-steps">
            <li><span className="step">1</span> Share your referral code with friends</li>
            <li><span className="step">2</span> Your friend signs up using your code</li>
            <li><span className="step">3</span> Your friend plays and wins games</li>
            <li><span className="step">4</span> You earn 2% of their winnings!</li>
          </ul>
          <p className="reward-example">For example: If your friend plays for ₹10,000 and wins, you will receive ₹200 as a referral bonus.</p>
        </div>
      </div>

      <div className="refer-card referral-code">
        <h3>Your Referral Code</h3>
        <div className="code-container">
          <div className="code">{referralCode || 'Loading...'}</div>
          <button 
            className="copy-btn" 
            onClick={() => copyToClipboard(referralCode)}
            disabled={!referralCode}
          >
            <FaCopy /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="refer-card referral-link">
        <h3>Share Your Link</h3>
        <div className="link-container">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="referral-link-input" 
          />
          <button 
            className="copy-btn" 
            onClick={() => copyToClipboard(referralLink)}
            disabled={!referralLink}
          >
            <FaCopy /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="share-options">
          <button className="share-btn whatsapp" onClick={shareOnWhatsApp}>
            <FaWhatsapp /> Share on WhatsApp
          </button>
          <button className="share-btn" onClick={() => copyToClipboard(referralLink)}>
            <FaShareAlt /> Share Link
          </button>
        </div>
      </div>

      <div className="refer-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h4>Total Referrals</h4>
            <p className="stat-value">{referrals.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCoins />
          </div>
          <div className="stat-content">
            <h4>Total Earnings</h4>
            <p className="stat-value">₹{rewards}</p>
          </div>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="refer-card referral-history">
          <h3>Your Referrals</h3>
          <div className="referral-list">
            {referrals.map((referral) => (
              <div key={referral.id} className="referral-item">
                <div className="referral-user">
                  <div className="user-avatar">{referral.referred?.username?.charAt(0) || '?'}</div>
                  <div className="user-name">{referral.referred?.username || 'Unknown User'}</div>
                </div>
                <div className="referral-status">
                  <span className={`status ${referral.status}`}>
                    {referral.status === 'completed' ? 'Bonus Credited' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferAndEarn;
