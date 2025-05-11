import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
    FaHome, FaWallet, FaHistory, FaShareAlt, FaBook, FaHeadset,
    FaKeycdn, FaDice,FaCheck
} from 'react-icons/fa';

// Import Components
import Navbar from './Components/Navbar';
import Sidebar from './Components/Sidebar';
import Footer from './Components/Footer';
import Auth from './Components/Auth';
import Profile from './Components/Profile';
import ProtectedRoute from './Components/ProtectedRoute';

// Import Pages
import Hero from './Pages/Hero';
import Support from './Pages/Support';
import KycPage from './Pages/Kyc';
import RulesPage from './Pages/Rules';
import SharePage from './Pages/Share';
import PlayGames from './Pages/PlayGames';
import Wallet from './Pages/Wallet';
import History from './Pages/History';
import AboutUs from './Pages/Aboutus';
import { MatchVerification } from './Pages/Matchverfication';


function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        { to: '/kyc', icon: <FaKeycdn />, text: 'Kyc' },
        { to: '/share', icon: <FaShareAlt />, text: 'Share' },
        { to: '/rules', icon: <FaBook />, text: 'Rules' },
        { to: '/support', icon: <FaHeadset />, text: 'Support' },
        { to: '/match-verification', icon: <FaCheck />, text: 'Match Verification' },
    ];

    return (
        <div className="app-container">
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
                        <Route path="/about" element={<AboutUs />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default App;