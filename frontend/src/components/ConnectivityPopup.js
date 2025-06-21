// FRONTEND/ConnectivityPopup.js
import React from 'react';
import { useConnectivity } from '../ConnectivityContext';
import '../Connectivity.css';

const ConnectivityPopup = () => {
    const { isConnected } = useConnectivity();

    if (isConnected) return null;

    return (
        <div className="connectivity-popup">
            <span className="material-icons connectivity-icon">cloud_off</span>
            <div className="connectivity-message">
                <h4>Connection Lost</h4>
                <p>No connection to the server. Please check your network.</p>
            </div>
        </div>
    );
};

export default ConnectivityPopup;