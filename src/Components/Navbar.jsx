import React, { useState, useEffect } from 'react';
import { FaBars, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Navbar = ({ toggleSidebar }) => {
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Initial fetch
        fetchWalletBalance();

        // Set up real-time subscription
        const walletSubscription = supabase
            .channel('wallet_changes')
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallets'
                },
                (payload) => {
                    if (payload.new) {
                        setWalletBalance(payload.new.balance);
                    }
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            walletSubscription.unsubscribe();
        };
    }, []);

    const fetchWalletBalance = async () => {
        try {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                console.log('No active session');
                setIsLoading(false);
                return;
            }

            const { data: walletData, error } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching wallet:', error.message);
                return;
            }

            if (walletData) {
                setWalletBalance(walletData.balance);
            } else {
                // Create a wallet if it doesn't exist
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert([
                        { user_id: session.user.id, balance: 0 }
                    ])
                    .select()
                    .single();

                if (!createError && newWallet) {
                    setWalletBalance(newWallet.balance);
                }
            }
        } catch (error) {
            console.error('Error:', error.message);
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