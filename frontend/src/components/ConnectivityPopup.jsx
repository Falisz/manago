// FRONTEND/Components/ConnectivityPopup.jsx
import React from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import Icon from './Icon';
import '../styles/ConnectivityPopup.css';

const ConnectivityPopup = () => {
    const { isConnected } = useApp();

    if (isConnected)
        return null;

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