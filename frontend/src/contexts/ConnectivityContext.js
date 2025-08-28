// FRONTEND/contexts/ConnectivityContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ConnectivityContext = createContext();

export const ConnectivityProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await axios.get('/ping', { withCredentials: true });
                setIsConnected(response.data.connected);
            } catch (error) {
                setIsConnected(false);
            }
        };

        checkConnection().then();

        const interval = setInterval(checkConnection, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <ConnectivityContext.Provider value={{ isConnected }}>
            {children}
        </ConnectivityContext.Provider>
    );
};

export const useConnectivity = () => useContext(ConnectivityContext);