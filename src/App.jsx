import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
    FaHome, FaWallet, FaHistory,  FaShareAlt, FaBook, FaHeadset,
    FaKeycdn,
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

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const sidebarItemsData = [
        { icon: <FaHome />, text: 'Home' },
        { icon: <FaWallet />, text: 'Wallet' },
        { icon: <FaHistory />, text: 'History' },
        { icon: <FaKeycdn />, text: 'Kyc' },
        { icon: <FaShareAlt />, text: 'Share' },
        { icon: <FaBook />, text: 'Rules' },
        { icon: <FaHeadset />, text: 'Support' },
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
                        <Route path="/support" element={<Support />} />
                        <Route path="/kyc" element={
                            <ProtectedRoute>
                                <KycPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/rules" element={<RulesPage />} />
                        <Route path="/share" element={<SharePage />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default App;