import React from 'react';
// Removed useState, layout components (Navbar, Sidebar, Footer), and icons not used here

// Import GameCard with correct path (lowercase 'components')
import GameCard from '../components/GameCard';


// Support Images
import instagram from "../assets/instagram.png";
import phone from "../assets/phone.png";
import telegram from "../assets/telegram.png";
import email from "../assets/email.png";

function Support() {
    // Data for contact/support cards
    const contactCardsData = [
        { img: instagram, alt: 'Instagram', text: 'Instagram' },
        { img: phone, alt: 'Phone', text: 'Phone' },
        { img: telegram, alt: 'Telegram', text: 'Telegram' },
        { img: email, alt: 'Email', text: 'Email' },
    ];

    // Support component now only returns the content for its route
    // The className="game-area" applied in App.jsx might need adjustment
    // depending on how you want the support page styled.
    // You might want a different className on the <main> tag in App.jsx
    // or wrap this content in a div with specific styles.
    return (
        <React.Fragment> { /* Use fragment to avoid unnecessary div */}
            {contactCardsData.map((card, index) => (
                <GameCard
                    key={index}
                    img={card.img}
                    alt={card.alt}
                    text={card.text}
                    // comingSoon prop likely not needed for support cards
                />
            ))}
        </React.Fragment>
    );
}

export default Support;