import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PlayGames from '../Pages/PlayGames';


function Sidebar({ isOpen, items, onClose }) {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                getUserProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                getUserProfile(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const getUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setUsername(data.username);
                setAvatarUrl(data.avatar_url);
            } else {
                // If no profile exists, create one
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: userId,
                            username: '',
                            updated_at: new Date(),
                        }
                    ]);
                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error.message);
        }
    };

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            navigate('/');
            onClose();
        } catch (error) {
            console.error('Error signing out:', error.message);
        }
    };

    const handleLinkClick = () => {
        onClose();
    };

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <div className="profile-placeholder">
                    {user ? (
                        <Link to="/profile" className="profile-link" onClick={handleLinkClick}>
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={username || 'User avatar'} 
                                    className="user-avatar"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <FaUserCircle size={40} />
                            )}
                            <span>{username || 'Loading...'}</span>
                        </Link>
                    ) : (
                        <Link to="/auth" className="profile-link" onClick={handleLinkClick}>
                            <FaUserCircle size={40} />
                            <span>Sign In</span>
                        </Link>
                    )}
                </div>
            </div>
            <ul className="nav-list">
                {items.map((item, index) => {
                    const path = item.text.toLowerCase() === 'home' ? '/'
                               : item.text.toLowerCase() === 'support' ? '/support'
                               : item.text.toLowerCase() === 'kyc' ? '/kyc'
                               : item.text.toLowerCase() === 'rules' ? '/rules'
                               : item.text.toLowerCase() === 'share' ? '/share'
                               : item.text.toLowerCase() === 'play games' ? '/playgames'
                               : item.text.toLowerCase() === 'wallet' ? '/wallet'
                               : item.text.toLowerCase() === 'history' ? '/history'
                               : '#';

                    return (
                        <li key={index}>
                            {path !== '#' ? (
                                <Link to={path} onClick={handleLinkClick}>
                                    {item.icon}
                                    {item.text}
                                </Link>
                            ) : (
                                <a href={path} onClick={handleLinkClick}>
                                    {item.icon}
                                    {item.text}
                                </a>
                            )}
                        </li>
                    );
                })}
                {/* {user && (
                    <li>
                        <Link to="/profile" onClick={handleLinkClick}>
                            <FaUserCircle />
                            Profile
                        </Link>
                    </li>
                )} */}
                {user && (
                    <li>
                        <button onClick={handleSignOut} className="sign-out-button">
                            <FaUserCircle />
                            Sign Out
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
}

export default Sidebar; 