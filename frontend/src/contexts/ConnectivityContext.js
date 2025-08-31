// FRONTEND/contexts/ConnectivityContext.js
import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import axios from 'axios';

const ConnectivityContext = createContext();

export const ConnectivityProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [appConfig, setAppConfig] = useState({ theme: process.env['REACT_APP_THEME'] || 'dark', palette: process.env['REACT_APP_COLOR'] || 'blue' });

    const checkConnection = useCallback(async () => {
        try {
            const response = await axios.get('/ping', { withCredentials: true });
            setIsConnected(response.data.connected);
            if (response.data.app_theme && response.data.app_palette) {
                setAppConfig({ theme: response.data.app_theme, palette: response.data.app_palette });
            }
        } catch (error) {
            setIsConnected(false);
        }
    }, []);

    useEffect(() => {
        checkConnection().then();

        const interval = setInterval(checkConnection, 60000);

        return () => clearInterval(interval);
    }, [checkConnection]);

    return (
        <ConnectivityContext.Provider value={{ isConnected, appConfig }}>
            {children}
        </ConnectivityContext.Provider>
    );
};

export const useConnectivity = () => useContext(ConnectivityContext);