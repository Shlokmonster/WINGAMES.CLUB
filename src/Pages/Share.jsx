import React, { useState, useEffect } from 'react';
import {
  FaWhatsapp,
  FaTwitter,
  FaEnvelope,
  FaLink,
  FaShareAlt,
  FaCopy,
  FaFacebook,
  FaTelegram,
  FaCheck
} from 'react-icons/fa';

const SharePage = () => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('wingames.club');
  const [appName] = useState('WinGames Club');
  const [shareMessage] = useState('Play games and win real money!');
  
  // Full share message
  const fullShareMessage = `Check out ${appName}! ${shareMessage} ${shareUrl}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(fullShareMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="share-page-container">
      <div className="share-header">
        <h1>Share <span className="highlight">WinGames</span></h1>
        <p>Invite friends to join the excitement!</p>
      </div>
      
      <div className="share-preview-card">
        <div className="share-preview-content">
          <div className="share-preview-icon">
            <FaShareAlt />
          </div>
          <div className="share-preview-text">
            <p>{fullShareMessage}</p>
          </div>
        </div>
        <button 
          className={`share-copy-btn ${copied ? 'copied' : ''}`} 
          onClick={copyShareLink}
        >
          {copied ? <>Copied! <FaCheck /></> : <>Copy <FaCopy /></>}
        </button>
      </div>
      
      <div className="share-section-title">
        <h2>Share via</h2>
      </div>
      
      <div className="share-grid">
        <div 
          className="share-card whatsapp" 
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullShareMessage)}`, '_blank')}
        >
          <div className="share-icon-wrapper">
            <FaWhatsapp />
          </div>
          <p>WhatsApp</p>
        </div>

        <div 
          className="share-card facebook" 
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`Check out ${appName}! ${shareMessage}`)}`, '_blank')}
        >
          <div className="share-icon-wrapper">
            <FaFacebook />
          </div>
          <p>Facebook</p>
        </div>

        <div 
          className="share-card twitter" 
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareMessage)}`, '_blank')}
        >
          <div className="share-icon-wrapper">
            <FaTwitter />
          </div>
          <p>Twitter</p>
        </div>

        <div 
          className="share-card telegram" 
          onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${appName}! ${shareMessage}`)}`, '_blank')}
        >
          <div className="share-icon-wrapper">
            <FaTelegram />
          </div>
          <p>Telegram</p>
        </div>

        <div 
          className="share-card email" 
          onClick={() => window.open(`mailto:?subject=Check out ${appName}&body=${encodeURIComponent(`Hey, check out ${appName}! ${shareMessage} ${shareUrl}`)}`, '_blank')}
        >
          <div className="share-icon-wrapper">
            <FaEnvelope />
          </div>
          <p>Email</p>
        </div>

        <div 
          className="share-card copy" 
          onClick={copyShareLink}
        >
          <div className="share-icon-wrapper">
            <FaCopy />
          </div>
          <p>{copied ? 'Copied!' : 'Copy Link'}</p>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
