import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PlayGames from '../Pages/PlayGames';

function Sidebar({ isOpen, items, onClose }) {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

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

        // Handle click outside
        const handleClickOutside = (event) => {
            if (sidebarRef.current && 
                !sidebarRef.current.contains(event.target) && 
                !event.target.closest('#menu-btn') && // Don't close if clicking menu button
                isOpen) {
                onClose();
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const getUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUsername(data?.username || '');
            setAvatarUrl(data?.avatar_url);
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

    const handleNavigation = (to) => {
        navigate(to);
        onClose();
    };

    return (
        <>
            <nav ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <div className="profile-placeholder">
                        {user ? (
                            <div 
                                className="profile-link" 
                                onClick={() => handleNavigation('/profile')}
                                style={{ cursor: 'pointer' }}
                            >
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
                            </div>
                        ) : (
                            <div 
                                className="profile-link" 
                                onClick={() => handleNavigation('/auth')}
                                style={{ cursor: 'pointer' }}
                            >
                                <FaUserCircle size={40} />
                                <span>Sign In</span>
                            </div>
                        )}
                    </div>
                </div>
                <ul className="nav-list">
                    {items.map((item, index) => (
                        (!item.requiresAuth || user) && (
                            <li key={index}>
                                <div
                                    className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
                                    onClick={() => handleNavigation(item.to)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {item.icon}
                                    <span>{item.text}</span>
                                </div>
                            </li>
                        )
                    ))}
                    {user && (
                        <li>
                            <div
                                className="nav-item sign-out-button"
                                onClick={handleSignOut}
                                style={{ cursor: 'pointer' }}
                            >
                                <FaUserCircle />
                                <span>Sign Out</span>
                            </div>
                        </li>
                    )}
                </ul>
            </nav>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
        </>
    );
}

export default Sidebar; 