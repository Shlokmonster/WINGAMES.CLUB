import React from 'react';
import { FaInstagram, FaPhone, FaTelegram } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import GameCard from '../Components/GameCard';

function Support() {
    // Data for contact/support cards with React icons
    const contactCardsData = [
        { 
            icon: <FaInstagram size={40} color="#E1306C" />,
            alt: 'Instagram', 
            text: 'Instagram', 
            link: 'https://instagram.com/youraccount',
            description: 'Follow us for updates and announcements'
        },
        { 
            icon: <FaPhone size={40} color="#25D366" />,
            alt: 'Phone', 
            text: 'Phone Support', 
            link: 'tel:+1234567890',
            description: '24/7 Customer Support'
        },
        { 
            icon: <FaTelegram size={40} color="#0088cc" />,
            alt: 'Telegram', 
            text: 'Telegram Channel', 
            link: 'https://t.me/yourchannel',
            description: 'Join our community channel'
        },
        { 
            icon: <MdEmail size={40} color="#EA4335" />,
            alt: 'Email', 
            text: 'Email Support', 
            link: 'mailto:support@yourdomain.com',
            description: 'Get help via email'
        },
    ];

    // Support component now only returns the content for its route
    // The className="game-area" applied in App.jsx might need adjustment
    // depending on how you want the support page styled.
    // You might want a different className on the <main> tag in App.jsx
    // or wrap this content in a div with specific styles.
    return (
        <div className="support-container">
            <div className="support-header">
                <h1>Support & Contact</h1>
                <p>We're here to help! Choose your preferred way to reach us.</p>
            </div>
            <div className="support-cards-grid">
                {contactCardsData.map((card, index) => (
                    <a 
                        key={index} 
                        href={card.link} 
                        className="support-card"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div className="support-card-content">
                            <div className="support-card-icon">
                                {card.icon}
                            </div>
                            <h3>{card.text}</h3>
                            <p>{card.description}</p>
                        </div>
                    </a>
                ))}
            </div>
            <div className="support-footer">
                <p>Response time: Usually within 24 hours</p>
                <p>Available 24/7 for urgent matters</p>
            </div>
        </div>
    );
}

export default Support;