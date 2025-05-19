import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaEnvelope, FaLock, FaUser, FaMobileAlt } from 'react-icons/fa'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [tab, setTab] = useState('mobile') // 'email' or 'mobile', default to 'mobile'
  const [phone, setPhone] = useState('')
  const [otp, setOTP] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [requireUsername, setRequireUsername] = useState(false) // For profile creation after OTP
  const [pendingUserId, setPendingUserId] = useState(null) // For new users post-OTP
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract referral code from URL on component mount
  useEffect(() => {
    // Parse the query parameters from the URL
    const queryParams = new URLSearchParams(location.search)
    const refCode = queryParams.get('ref')
    
    if (refCode) {
      setReferralCode(refCode)
      console.log('Referral code detected:', refCode)
      // Auto-switch to sign up tab when coming from a referral link
      setIsSignUp(true)
    }
  }, [location])

  // Email/Password Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Store username in user metadata
            referral_code: referralCode // Store referral code in user metadata
          }
        }
      })
      if (error) throw error

      if (user) {
        // Store signup data in localStorage for later use after email verification
        localStorage.setItem('pendingSignup', JSON.stringify({
          username,
          referralCode
        }))
        
        alert('Check your email for the confirmation link! After verifying your email, please sign in to complete your profile setup.')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Email/Password Sign In
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check if this is a first login after email verification
      const pendingSignup = localStorage.getItem('pendingSignup')
      if (pendingSignup && user) {
        const { username, referralCode } = JSON.parse(pendingSignup)
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username,
              updated_at: new Date(),
            },
          ])
        if (profileError) throw profileError

        // If there's a referral code, create the referral relationship
        if (referralCode) {
          try {
            // Find the referrer using the referral code
            const { data: referrerData, error: referrerError } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', referralCode)
              .single()
            
            if (referrerError) {
              console.error('Error finding referrer:', referrerError.message)
            } else if (referrerData) {
              // Create referral record
              const { error: referralError } = await supabase
                .from('referrals')
                .insert([
                  {
                    referrer_id: referrerData.id,
                    referred_id: user.id,
                    referral_code: referralCode,
                    status: 'pending'
                  }
                ])
              
              if (referralError) {
                console.error('Error creating referral:', referralError.message)
              }
            }
          } catch (refErr) {
            console.error('Error processing referral:', refErr.message)
          }
        }

        // Clear the pending signup data
        localStorage.removeItem('pendingSignup')
      }

      navigate('/')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mobile OTP: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setRequireUsername(false);
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    setLoading(true);
    const otpResult = await supabase.auth.signInWithOtp({
      phone: '+91' + phone
    });
    setLoading(false);
    if (otpResult.error) {
      setError(otpResult.error.message);
    } else {
      setOtpSent(true);
    }
  }

  // Mobile OTP: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data: verifyOtpData, error: verifyOtpError } = await supabase.auth.verifyOtp({
      phone: '+91' + phone,
      token: otp,
      type: 'sms'
    });
    setLoading(false);
    if (verifyOtpError) {
      setError(verifyOtpError.message);
      return;
    }
    // After OTP, check for profile
    const userId = verifyOtpData.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    if (!profile) {
      // New user: generate random username and create profile
      setLoading(true);
      const randomUsername = 'user' + Math.floor(100000 + Math.random() * 900000);
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: randomUsername }]);
      if (insertProfileError) {
        setLoading(false);
        setError('Failed to create profile: ' + insertProfileError.message);
        return;
      }
      // If referral code is present, create referral relationship
      if (referralCode) {
        const { data: referrerData, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        if (referrerError) {
          console.error('Error finding referrer:', referrerError.message);
        } else if (referrerData) {
          const { error: referralInsertError } = await supabase
            .from('referrals')
            .insert([
              {
                referrer_id: referrerData.id,
                referred_id: userId,
                referral_code: referralCode,
                status: 'pending'
              }
            ]);
          if (referralInsertError) {
            console.error('Error creating referral:', referralInsertError.message);
          } else {
            console.log('Referral relationship created successfully');
          }
        }
      }
      setLoading(false);
      navigate('/');
      return;
    }
    // Existing user, go to profile
    navigate('/');
  }


  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to WinGames Ludo</h2>
        <div className="auth-tabs">
          <button className={`auth-tab active`}>Mobile</button>
        </div>

        {/* Email/Password Form */}
        {/*
        {tab === 'email' && (
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="auth-form">
            <div className="form-group">
              <div className="input-icon">
                <FaEnvelope className="icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
            </div>
            {isSignUp && (
              <div className="form-group">
                <div className="input-icon">
                  <FaUser className="icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    style={{textIndent:"15px"}}
                  />
                </div>
              </div>
            )}
            <div className="form-group">
              <div className="input-icon">
                <FaLock className="icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="button primary block" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
        */}

        {/* Mobile OTP Form */}
        {tab === 'mobile' && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="auth-form">
            <div className="form-group">
              <div className="input-icon">
                <FaMobileAlt className="icon" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/, ''))}
                  placeholder="Phone (10 digits)"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOTP(e.target.value.replace(/\D/, ''))}
                    placeholder="Enter OTP"
                    maxLength={6}
                    required
                  />
                </div>
                <button type="button" className="button block" style={{marginTop: 8}} onClick={handleSendOTP} disabled={loading}>
                  {loading ? 'Resending...' : 'Resend OTP'}
                </button>
                <button type="button" className="button block" style={{marginTop: 8}} onClick={() => { setOtpSent(false); setOTP(''); }}>
                  Change Number
                </button>
              </>
            )}
            <button type="submit" className="button primary block" disabled={loading}>
              {loading ? (otpSent ? 'Verifying...' : 'Sending OTP...') : (otpSent ? 'Verify & Login' : 'Send OTP')}
            </button>
            {error && <div className="auth-error">{error}</div>}
            {otpSent && !error && <div className="auth-success">OTP sent! If you didn't receive it, you can resend.</div>}
          </form>
        )}
      </div>
    </div>
  )
}