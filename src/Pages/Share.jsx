import React from 'react';
import {
  FaWhatsapp,
  FaTwitter,
  FaEnvelope,
  FaLink
} from 'react-icons/fa';


const SharePage = () => {
  const shareUrl = 'wingames.club';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <div className="share-grid">
      <div className="share-card whatsapp" onClick={() => window.open(`https://wa.me/+91 98765 43210?text=Check this out: ${encodeURIComponent(shareUrl)}`, '_blank')}>
        <FaWhatsapp size={50} />
        <p>WhatsApp</p>
      </div>

      <div className="share-card twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check this out: ${encodeURIComponent(shareUrl)}`, '_blank')}>
        <FaTwitter size={50} />
        <p>Twitter</p>
      </div>

      <div className="share-card copy" onClick={copyShareLink}>
        <FaLink size={50} />
        <p>Copy Link</p>
      </div>

      <div className="share-card email" onClick={() => window.open(`mailto:?subject=Check this out&body=Hey, check this out: ${shareUrl}`)}>
        <FaEnvelope size={50} />
        <p>Email</p>
      </div>
    </div>
  );
};

export default SharePage;
