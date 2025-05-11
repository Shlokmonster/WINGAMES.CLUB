// src/Components/GameCard.jsx
import React from 'react';

function GameCard({ img, alt, text, comingSoon }) {
  return (
    <div className="game-card">
      <img src={img} alt={alt} />
      <div className={`card-text${comingSoon ? ' coming-soon' : ''}`}>
        {text}
      </div>
    </div>
  );
}

export default GameCard;