// FRONTEND/contexts/ConnectivityContext.js
import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import axios from 'axios';

const ConnectivityContext = createContext();

export const ConnectivityProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [modules, setModules] = useState([]);

    const fetchModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules', { withCredentials: true });
            setModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setModules([]);
        }
    }, []);

    const toggleModule = useCallback(async (id, enabled) => {
        try {
            await axios.put(`/modules/${id}`, { enabled }, { withCredentials: true });
            await fetchModules();
        } catch (error) {
            console.error('Error toggling module:', error);
        }
    }, [fetchModules]);

    const handleToggle = useCallback(async (moduleId, enabled) => {
        const newEnabled = !enabled;
        if (window.confirm(`Are you sure you want to ${newEnabled ? 'enable' : 'disable'} the module #${moduleId}?`)) {
            await toggleModule(moduleId, newEnabled);
        }
    }, [toggleModule]);

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
        fetchModules().then();

        const interval = setInterval(checkConnection, 60000);

        return () => clearInterval(interval);
    }, [fetchModules]);

    return (
        <ConnectivityContext.Provider value={{ isConnected, modules, handleToggle, toggleModule }}>
            {children}
        </ConnectivityContext.Provider>
    );
};

export const useConnectivity = () => useContext(ConnectivityContext);