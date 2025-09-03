// FRONTEND/ConnectivityPopup.js
import React from 'react';
import useAppStatus from '../contexts/AppStatusContext';
import '../assets/styles/Connectivity.css';
import Button from './Button';

const ConnectivityPopup = () => {
    const { appConfig } = useAppStatus();

    if (appConfig?.is_connected) return null;

    return (
        <div className="connectivity-popup">
            <span className="material-icons connectivity-icon">cloud_off</span>
            <div className="connectivity-message">
                <h1>Connection Lost</h1>
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