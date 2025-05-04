import React, { useState, useEffect } from 'react';
import { FaBars, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Navbar = ({ toggleSidebar }) => {
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check and set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                fetchWalletBalance(session.user.id);
            } else {
                setWalletBalance(0);
            }
        });

        // Initial fetch
        checkSessionAndFetchWallet();
    }, []);

    const checkSessionAndFetchWallet = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session error:', sessionError.message);
                return;
            }

            if (session?.user) {
                await fetchWalletBalance(session.user.id);
            } else {
                console.log('No active session');
                setWalletBalance(0);
            }
        } catch (error) {
            console.error('Error checking session:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWalletBalance = async (userId) => {
        try {
            setIsLoading(true);
            
            // First try to get existing wallet
            let { data: wallet, error } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Wallet doesn't exist, create one
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert([{ user_id: userId, balance: 0 }])
                    .select()
                    .single();

                if (createError) {
                    throw createError;
                }

                wallet = newWallet;
            } else if (error) {
                throw error;
            }

            setWalletBalance(wallet?.balance || 0);
        } catch (error) {
            console.error('Error fetching/creating wallet:', error.message);
            setWalletBalance(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletClick = () => {
        navigate('/wallet');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <FaBars />
                </button>
                <div className="logo-text">
                    <h1>WINGAMES</h1>
                </div>
            </div>
            <div className="navbar-right">
                <div className="wallet-balance" onClick={handleWalletClick}>
                    <div className="wallet-icon">
                        <FaWallet />
                    </div>
                    <div className="wallet-info">
                        <span className="wallet-label">FUNDS</span>
                        <span className="wallet-amount">
                            ₹ {isLoading ? "..." : walletBalance}
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;