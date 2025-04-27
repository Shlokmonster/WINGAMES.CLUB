import React from 'react';
import { FaBars } from 'react-icons/fa';


function Navbar({ toggleSidebar }) {
    // Using FaPaw directly, could be passed as a prop if needed

    return (
        <header className="app-header">
            <button className="menu-btn" id="menu-btn" onClick={toggleSidebar}>
                <FaBars />
            </button>
            <div className="logo-placeholder">
            <h3>WINGAMES</h3>
            </div>
        </header>
    );
}

export default Navbar;