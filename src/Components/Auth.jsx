import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
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
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/profile')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to WinGames Ludo</h2>
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>
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
        </form>
      </div>
    </div>
  )
} 