import React from 'react';

function GameCard({ img, alt, text, comingSoon }) {
    return (
        <div className={`game-card ${comingSoon ? 'coming-soon' : ''}`}>
            <img src={img} alt={alt} className='game-card-img' />
            <span>{text}</span>
        </div>
    );
}

export default GameCard; 