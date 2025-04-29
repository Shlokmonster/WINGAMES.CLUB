import React, { useState } from 'react';
import { FaDice } from 'react-icons/fa';

const PlayGames = () => {
    const [selectedAmount, setSelectedAmount] = useState(null);
    const betAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
    };

    return (
        <div className="play-games-container">
            <div className="betting-dashboard">
                <h2>Select Bet Amount</h2>
                <div className="bet-amounts-grid">
                    {betAmounts.map((amount) => (
                        <button
                            key={amount}
                            className={`bet-amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                            onClick={() => handleAmountSelect(amount)}
                        >
                            <FaDice className="dice-icon" />
                            <span>₹{amount}</span>
                        </button>
                    ))}
                </div>
                {selectedAmount && (
                    <div className="selected-bet-info">
                        <p>Selected Bet: ₹{selectedAmount}</p>
                        <button className="start-game-btn">Start Game</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayGames; 