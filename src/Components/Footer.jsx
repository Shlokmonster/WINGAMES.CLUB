import React from 'react';
import { FaWhatsapp, FaChrome } from 'react-icons/fa';


function Footer() {
    // Add onClick handlers or props as needed for functionality
    return (
        <footer className="app-footer">
            <button className="contact-admin-btn">
                <FaWhatsapp /> Contact Admin
            </button>
            {/* Alternate Footer Text - uncomment if needed */}
            {/* 
            <p className="footer-text">
                For best experience, open GreatIndianEagle.com on <FaChrome /> chrome mobile
            </p>
            */}
        </footer>
    );
}

export default Footer; 