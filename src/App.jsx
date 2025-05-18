import React, { useState, useEffect, Suspense } from 'react';
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

// Import Pages with React.lazy for code splitting
const Hero = React.lazy(() => import('./Pages/Hero'));
const Support = React.lazy(() => import('./Pages/Support'));
const KycPage = React.lazy(() => import('./Pages/Kyc'));
const RulesPage = React.lazy(() => import('./Pages/Rules'));
const SharePage = React.lazy(() => import('./Pages/Share'));
const PlayGames = React.lazy(() => import('./Pages/PlayGames'));
const Wallet = React.lazy(() => import('./Pages/Wallet'));
const History = React.lazy(() => import('./Pages/History'));
const MatchVerification = React.lazy(() => import('./Pages/Matchverfication'));
const ReferPage = React.lazy(() => import('./Pages/Refer'));
const Admin = React.lazy(() => import('./Pages/Admin'));
const AboutUs = React.lazy(() => import('./Pages/AboutUs'));


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

                <Suspense fallback={<Loader />}>
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
                </Suspense>

                <Footer />
            </div>
        </div>
    );
}

// Animated loader for Suspense fallback
function Loader() {
  return (
    <div className="lazy-loader">
      <div className="circle-loader">
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
      </div>
    </div>
  );
}

export default App;