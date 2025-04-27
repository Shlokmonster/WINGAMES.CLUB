import React from 'react';


const RulesPage = () => {
  return (
    <div className="rules-grid-container">
      <div className="rules-box">
        <h2>🎮 Game Rules</h2>
        <h3>Ludo</h3>
        <ul>
          <li>Roll a 6 to move a token out of your base.</li>
          <li>Capture opponent tokens to send them back to base.</li>
          <li>First to bring all 4 tokens to Home wins.</li>
          <li>Extra turn on 6 or a capture.</li>
        </ul>
        <h3>Snakes & Ladders</h3>
        <ul>
          <li>Roll and move forward.</li>
          <li>Climb ladders, avoid snakes.</li>
          <li>Exactly reach square 100 to win.</li>
        </ul>
      </div>

      <div className="rules-box">
        <h2>📜 Terms & Conditions</h2>
        <ul>
          <li>Must be 18+ to play.</li>
          <li>Restricted states: Assam, Odisha, etc.</li>
          <li>Exploiting bugs = ban.</li>
          <li>Terms may change anytime.</li>
        </ul>
      </div>

      <div className="rules-box">
        <h2>🔒 Privacy Policy</h2>
        <ul>
          <li>We encrypt all personal data.</li>
          <li>No selling or sharing of info.</li>
          <li>Users can access, update, or delete data.</li>
        </ul>
      </div>

      <div className="rules-box">
        <h2>🎯 Responsible Gaming</h2>
        <ul>
          <li>Set limits. Play smart.</li>
          <li>Don’t chase losses — take breaks.</li>
          <li>Gaming is for fun, not income.</li>
          <li>Self-ban tools available.</li>
        </ul>
      </div>
    </div>
  );
};

export default RulesPage;
