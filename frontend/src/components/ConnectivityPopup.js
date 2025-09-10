// FRONTEND/ConnectivityPopup.js
import React from 'react';
import useAppState from '../contexts/AppStateContext';
import '../assets/styles/Connectivity.css';
import Button from './Button';
import Icon from "./Icon";

const ConnectivityPopup = () => {
    const { appState } = useAppState();

    if (appState?.is_connected) return null;

    return (
        <div className='connectivity-popup'>
            <Icon
                className={'connectivity-icon'}
                i={'cloud_off'}
                s={true}
            />
            <div className='connectivity-message'>
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