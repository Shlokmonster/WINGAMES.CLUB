import React from 'react';
// Removed useState, layout components (Navbar, Sidebar, Footer), and icons not used here

// Import GameCard with correct path (lowercase 'components')
import GameCard from '../components/GameCard';

// Placeholder images
import snakes from '../assets/snake.png';
import poker from '../assets/poker.png';
import ludo from '../assets/ludo.png';
import rummy from '../assets/rummy.png';

function Hero() {
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
            {gameCardsData.map((card, index) => (
                <GameCard
                    key={index}
                    img={card.img}
                    alt={card.alt}
                    text={card.text}
                    comingSoon={card.comingSoon}
                />
            ))}
        </React.Fragment>
    );
}

export default Hero;
