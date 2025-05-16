import React from 'react';

const SplashScreen = ({ fading }) => {
  return (
    <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
      <div className="splash-banner">
        <h1 className="splash-text">WINGAMES.CLUB</h1>
      </div>
    </div>
  );
};

export default SplashScreen;
