// frontend/components/Common.js
import React from 'react';

export const Header = ({user, onLogout}) => (
    <header>
        <h1 className='site-logo'><a href="/">Manager Portal</a></h1>
            {user ? (
                <div className='right-box'>
                    <span className='username'>Welcome, {user?.username || 'User'}</span> | <button onClick={onLogout}>Logout</button> | <a href="http://localhost:3000">Go to Staff Portal</a>
                </div>
            ) :
                <div className='right-box'>
                    <a href="http://localhost:3000">Go to Staff Portal</a>
                </div>
            }
    </header>
);

export const Footer = () => (
    <footer>
        <p>&copy; 2025 Manager Portal</p>
    </footer>
);

export const NoAccess = ({ onLogout }) => (
    <div className="no-access">
        <h2>403 - Access Denied</h2>
        <p>You don't have sufficient permissions to visit this portal.</p>
        <button onClick={onLogout}>Logout</button>
    </div>
);

export const NotFound = () => (
    <div>
        <h2>404 - Page Not Found</h2>
        <p>The page you're looking for does not exist.</p>
    </div>
);

export const Loading = () => (
    <div>Loading</div>
);
