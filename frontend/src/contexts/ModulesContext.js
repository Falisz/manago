// FRONTEND/contexts/ModulesContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ModulesContext = createContext();

export const ModulesProvider = ({ children }) => {
    const { user } = useAuth();
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
        if (user) {
            fetchModules().then();
        }
    }, [user, fetchModules]);

    return (
        <ModulesContext.Provider value={{ modules, handleToggle, toggleModule }}>
            {children}
        </ModulesContext.Provider>
    );
};

export const useModules = () => useContext(ModulesContext);