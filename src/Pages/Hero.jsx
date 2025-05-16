import React from 'react';
import { useNavigate } from 'react-router-dom';
// Removed useState, layout components (Navbar, Sidebar, Footer), and icons not used here

// Import GameCard with correct path (lowercase 'components')
import GameCard from '../Components/GameCard';
import AboutUs from "../Pages/AboutUs"

// Placeholder images
import snakes from '../assets/snake.png';
import poker from '../assets/poker.png';
import ludo from '../assets/ludo.png';
import rummy from '../assets/rummy.png';



function Hero() {
    const navigate = useNavigate();
    // Data for game cards - specific to this page
    const gameCardsData = [
        { img: ludo, alt: 'Ludo Game', text: 'Ludo Game', comingSoon: false },
        { img: snakes, alt: 'Snake Ladder Game', text: 'Snake Ladder Game', comingSoon: false },
        { img: poker, alt: 'Poker Game', text: 'Coming Soon', comingSoon: true },
        { img: rummy, alt: 'Classic Rummy Game', text: 'Coming Soon', comingSoon: true },
    ];

    // Hero component now only returns the content for its route
    // The className="game-area" is applied in App.jsx's <main> tag
    return (
        <React.Fragment> { /* Use fragment to avoid unnecessary div */}
            <div className="payment-notice">
                <p>Pay only to the displayed UPI/account; others won't be credited. <br /> Support: +91 80584 54132, +91 93515 39220</p>
            </div>
            
            <button
                className="about-us-btn"
                onClick={() => navigate('/aboutus')}
            >
                About Us
            </button>
            {gameCardsData.map((card, index) => (
                <div
                    key={index}
                    onClick={() => {
                        if (!card.comingSoon) navigate('/playgames');
                    }}
                    style={{ cursor: card.comingSoon ? 'not-allowed' : 'pointer' }}
                >
                    <GameCard
                        img={card.img}
                        alt={card.alt}
                        text={card.text}
                        comingSoon={card.comingSoon}
                    />
                </div>
            ))}
        </React.Fragment>
    );
}

export default Hero;
