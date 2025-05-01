import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
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

    // Add Match Verification to navigation items if user is authenticated
    const getNavigationItems = () => {
        const baseItems = items || [];
        return baseItems;
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
                {getNavigationItems().map((item, index) => (
                    (!item.requiresAuth || user) && (
                        <li key={index}>
                            {item.to !== '#' ? (
                                <Link to={item.to} onClick={handleLinkClick}>
                                    {item.icon}
                                    {item.text}
                                </Link>
                            ) : (
                                <a href={item.to} onClick={handleLinkClick}>
                                    {item.icon}
                                    {item.text}
                                </a>
                            )}
                        </li>
                    )
                ))}
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