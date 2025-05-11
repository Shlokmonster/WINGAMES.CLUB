import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { FaEnvelope, FaLock, FaUser, FaMobileAlt } from 'react-icons/fa'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [tab, setTab] = useState('email') // 'email' or 'mobile'
  const [phone, setPhone] = useState('')
  const [otp, setOTP] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Email/Password Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error

      if (user) {
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
        alert('Check your email for the confirmation link!')
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/profile')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mobile OTP: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian phone number.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+91' + phone
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setOtpSent(true)
    }
  }

  // Mobile OTP: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({
      phone: '+91' + phone,
      token: otp,
      type: 'sms'
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      // Insert username if user is new (first login) and username is provided
      if (data && data.user && username) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        if (!profile && !profileError) {
          await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username,
                updated_at: new Date(),
              },
            ])
        }
      }
      navigate('/profile')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to WinGames Ludo</h2>
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${tab === 'email' && !isSignUp ? 'active' : ''}`}
            onClick={() => { setTab('email'); setIsSignUp(false); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${tab === 'email' && isSignUp ? 'active' : ''}`}
            onClick={() => { setTab('email'); setIsSignUp(true); setError(''); }}
          >
            Sign Up
          </button>
          <button 
            className={`auth-tab ${tab === 'mobile' ? 'active' : ''}`}
            onClick={() => { setTab('mobile'); setError(''); setOtpSent(false); }}
          >
            Phone
          </button>
        </div>

        {/* Email/Password Form */}
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
            {!otpSent && (
              <div className="form-group">
                <div className="input-icon">
                  <FaUser className="icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username (optional for existing users)"
                    style={{textIndent: '15px'}}
                  />
                </div>
              </div>
            )}
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