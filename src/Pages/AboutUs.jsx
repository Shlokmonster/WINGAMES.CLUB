import React from "react";

const AboutUs = () => {
  return (
    <section className="about-us-section">
      <h2 className="section-title">About Us</h2>
      <p className="about-text">
        <strong>WinGames.Club</strong> is a real-money gaming platform proudly owned and operated by SR Company
        (“WinGames.Club” or “We” or “Us” or “Our”).
      </p>

      <h3 className="section-subtitle">Our Business & Products</h3>
      <p className="about-text">
        We specialize in publishing high-quality HTML5 games, with a mission to eliminate the hassle of app installs and make gaming seamless, instant, and accessible.{" "}
        <strong>WinGames.Club</strong> is a skill-based gaming platform available exclusively to users in India, hosted at{" "}
        <a href="https://www.wingames.club" className="gold-link" target="_blank" rel="noopener noreferrer">
          https://www.wingames.club
        </a>. Players can participate in exciting Battles and Tournaments to win real cash prizes, which can be withdrawn through Paytm Wallet, Amazon Pay, Bank Transfer, Mobile Recharges, and more.
      </p>

      <h3 className="section-subtitle">Our Games</h3>
      <p className="about-text">
        <strong>WinGames.Club</strong> offers a growing library of premium HTML5 games, finely optimized for low-end devices, rare browsers, and unstable network conditions. We feature games across various genres including:
      </p>
      <ul className="about-list">
        <li>Arcade</li>
        <li>Action</li>
        <li>Adventure</li>
        <li>Sports & Racing</li>
        <li>Strategy</li>
        <li>Puzzle & Logic</li>
      </ul>
      <p className="about-text">
        We also offer an impressive range of multiplayer games such as Ludo, Chess, 8 Ball Pool, Carrom, Tic Tac Toe, Archery, Quiz, Chinese Checkers, and more!
      </p>
      <p className="about-text">
        Some of our fan favorites include <em>Escape Run</em>, <em>Bubble Wipeout</em>, <em>Tower Twist</em>, <em>Cricket Gunda</em>, and <em>Ludo With Friends</em>.
      </p>
      <p className="about-text">
        Are you a game developer or have a great idea for a new game? We'd love to hear from you! Reach out to us at{" "}
        <a href="mailto:info@wingames.club" className="gold-link">
          info@wingames.club
        </a>.
      </p>
    </section>
  );
};

export default AboutUs;
