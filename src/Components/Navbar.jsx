import React, { useState, useEffect } from 'react';
import { FaBars, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Navbar = ({ toggleSidebar }) => {
    const [walletBalance, setWalletBalance] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWalletBalance();
    }, []);

    const fetchWalletBalance = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', user.id)
                    .single();
                
                if (data && !error) {
                    setWalletBalance(data.balance);
                }
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
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
                        <span className="wallet-amount">₹ {walletBalance}</span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;