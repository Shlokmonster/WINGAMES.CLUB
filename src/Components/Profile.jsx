import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { FaUserCircle, FaSignOutAlt, FaCamera, FaEdit } from 'react-icons/fa'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [avatar_url, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
        } else {
          // If no profile exists, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                username: '',
                updated_at: new Date(),
              }
            ])
          if (insertError) throw insertError
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(e) {
    e.preventDefault()
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      const updates = {
        id: user.id,
        username,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
      alert('Profile updated!')
      setIsEditing(false)
    } catch (error) {
      alert('Error updating profile!')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function uploadAvatar(event) {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { data: { user } } = await supabase.auth.getUser()
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          avatar_url: publicUrl,
          updated_at: new Date()
        })

      if (updateError) throw updateError
      setAvatarUrl(publicUrl)
    } catch (error) {
      alert('Error uploading avatar!')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-box">
        <div className="profile-header">
          <h2>Profile Settings</h2>
          <button onClick={handleSignOut} className="logout-button">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
        
        <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {avatar_url ? (
                <img
                  src={avatar_url}
                  alt="Avatar"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <FaUserCircle size={80} />
                </div>
              )}
              <label className="avatar-upload" htmlFor="single">
                <FaCamera className="camera-icon" />
              </label>
              <input
                type="file"
                id="single"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
            <p className="avatar-hint">Click to upload profile picture</p>
          </div>

          <form onSubmit={updateProfile} className="profile-form">
            <div className="form-group">
              <div className="input-with-icon">
                <input
                  type="text"
                  value={username || ''}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={!isEditing}
                  className={isEditing ? 'editing' : ''}
                />
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <FaEdit />
                </button>
              </div>
            </div>
            {isEditing && (
              <button className="button primary block" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
} 