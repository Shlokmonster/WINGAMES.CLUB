import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
    FaHome, FaWallet, FaHistory, FaShareAlt, FaBook, FaHeadset,
    FaKeycdn, FaDice, FaCheck, FaGift, FaUserShield
} from 'react-icons/fa';

// Import Components
import Navbar from './Components/Navbar';
import Sidebar from './Components/Sidebar';
import Footer from './Components/Footer';
import Auth from './Components/Auth';
import Profile from './Components/Profile';
import ProtectedRoute from './Components/ProtectedRoute';
import SplashScreen from './Components/SplashScreen';

// Import Pages
import Hero from './Pages/Hero';
import Support from './Pages/Support';
import KycPage from './Pages/Kyc';
import RulesPage from './Pages/Rules';
import SharePage from './Pages/Share';
import PlayGames from './Pages/PlayGames';
import Wallet from './Pages/Wallet';
import History from './Pages/History';

import { MatchVerification } from './Pages/Matchverfication';
import ReferPage from './Pages/Refer';
import Admin from './Pages/Admin';
import AboutUs from './Pages/AboutUs';


function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [splashFading, setSplashFading] = useState(false);
    
    useEffect(() => {
        // Start fade-out animation after 1.8 seconds
        const fadeTimer = setTimeout(() => {
            setSplashFading(true);
        }, 1800);
        
        // Hide splash screen after 2 seconds (total animation time)
        const hideTimer = setTimeout(() => {
            setShowSplash(false);
        }, 2300);
        
        // Clean up timers
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const sidebarItemsData = [
        { to: '/', icon: <FaHome />, text: 'Home' },
        { to: '/playgames', icon: <FaDice />, text: 'Play Games' },
        { to: '/wallet', icon: <FaWallet />, text: 'Wallet' },
        { to: '/history', icon: <FaHistory />, text: 'History' },
        { to: '/refer', icon: <FaGift />, text: 'Refer & Earn' },
        { to: '/kyc', icon: <FaKeycdn />, text: 'Kyc' },
        { to: '/share', icon: <FaShareAlt />, text: 'Share' },
        { to: '/rules', icon: <FaBook />, text: 'Rules' },
        { to: '/support', icon: <FaHeadset />, text: 'Support' },
        { to: '/match-verification', icon: <FaCheck />, text: 'Match Verification' },
    ];

    return (
        <div className="app-container">
            {showSplash && <SplashScreen fading={splashFading} />}
            <Sidebar 
                isOpen={isSidebarOpen} 
                items={sidebarItemsData} 
                onClose={closeSidebar}
            />

            <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`} id="main-content">
                <Navbar toggleSidebar={toggleSidebar} />

                <main className="game-area">
                    <Routes>
                        <Route path="/" element={<Hero />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/playgames" element={
                            <ProtectedRoute>
                                <PlayGames />
                            </ProtectedRoute>
                        } />
                        <Route path="/wallet" element={
                            <ProtectedRoute>
                                <Wallet />
                            </ProtectedRoute>
                        } />
                        <Route path="/history" element={
                            <ProtectedRoute>
                                <History />
                            </ProtectedRoute>
                        } />
                        <Route path="/support" element={<Support />} />
                        <Route path="/kyc" element={
                            <ProtectedRoute>
                                <KycPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/rules" element={<RulesPage />} />
                        <Route path="/share" element={<SharePage />} />
                        <Route path="/match-verification" element={
                            <ProtectedRoute>
                                <MatchVerification />
                            </ProtectedRoute>
                        } />
                        <Route path="/aboutus" element={<AboutUs />} />
                        <Route path="/refer" element={
                            <ProtectedRoute>
                                <ReferPage />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default App;