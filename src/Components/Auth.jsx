import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaLock, FaUser, FaMobileAlt, FaGift } from 'react-icons/fa'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract referral code from URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const refCode = queryParams.get('ref')
    
    if (refCode) {
      setReferralCode(refCode)
      console.log('Referral code detected:', refCode)
      setIsSignUp(true)
    }
  }, [location])

  // Phone/Password Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian phone number.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!username.trim()) {
      setError('Please enter a username.')
      return
    }

    try {
      setLoading(true)
      const fakeEmail = `${phone}@wingames.club`
      const { data: { user }, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      })
      if (error) throw error

      if (user) {
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

        alert('Registration successful! You are now signed in.')
        navigate('/')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Phone/Password Sign In
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian phone number.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)
      const fakeEmail = `${phone}@wingames.club`
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      })
      if (error) throw error

      navigate('/')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to WinGames Ludo</h2>
        
        <div className="auth-tabs" style={{ display: 'flex', marginBottom: '20px' }}>
          <button 
            type="button"
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
            style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
            style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="auth-form">
          {/* Username (Only for Sign Up) */}
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
                  style={{ textIndent: "15px" }}
                />
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="form-group">
            <div className="input-icon">
              <FaMobileAlt className="icon" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone (10 digits)"
                maxLength={10}
                required
                style={{ textIndent: "15px" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock className="icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{ textIndent: "15px" }}
              />
            </div>
          </div>

          {/* Referral Code (Only for Sign Up) */}
          {isSignUp && (
            <div className="form-group">
              <div className="input-icon">
                <FaGift className="icon" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Referral Code (Optional)"
                  style={{ textIndent: "15px" }}
                />
              </div>
            </div>
          )}

          <button type="submit" className="button primary block" disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          
          {error && <div className="auth-error" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</div>}
        </form>

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9em' }}>
          {isSignUp ? (
            <span style={{ color: '#aaa' }}>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setError(''); }} style={{ color: '#FFD700', fontWeight: 'bold' }}>
                Sign In
              </a>
            </span>
          ) : (
            <span style={{ color: '#aaa' }}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setError(''); }} style={{ color: '#FFD700', fontWeight: 'bold' }}>
                Sign Up
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}