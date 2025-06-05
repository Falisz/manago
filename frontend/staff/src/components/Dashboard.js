// Portal.js
import React from 'react';

const Dashboard = ({ user, onLogout }) => {
    return (
        <div>
            <h2>Staff Dashboard</h2>
            <p>Welcome, {user.username}!</p>
            <button onClick={onLogout}>Logout</button>
            <a href="http://localhost:3001">Go to Manager Portal</a>
        </div>
    );
};

export default Dashboard;
