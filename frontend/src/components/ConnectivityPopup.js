// FRONTEND/ConnectivityPopup.js
import React from 'react';
import { useAppStatus } from '../contexts/AppStatusContext';
import '../assets/styles/Connectivity.css';
import Button from './Button';

const ConnectivityPopup = () => {
    const { isConnected } = useAppStatus();

    if (isConnected) return null;

    return (
        <div className="connectivity-popup">
            <span className="material-icons connectivity-icon">cloud_off</span>
            <div className="connectivity-message">
                <h4>Connection Lost</h4>
                <p>No connection to the server. Please check your network.</p>
                <Button
                    onClick={() => window.location.reload()}
                >
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ConnectivityPopup;