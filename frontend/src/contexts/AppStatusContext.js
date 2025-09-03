// FRONTEND/contexts/AppStatusContext.js
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import componentMap from "../Components";
import InWorks from "../components/InWorks";

const AppStatusContext = createContext();

export const AppStatusProvider = ({ children }) => {
    const isCheckingUserRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [appConfig, setAppConfig] = useState({
        is_connected: true,
        theme: process.env['REACT_APP_THEME'] || 'dark',
        palette: process.env['REACT_APP_COLOR'] || 'blue',
        modules: [],
        pages: []
    });

    const authUser = useCallback(async (withLoader = false) => {
        if (isCheckingUserRef.current) return;

        isCheckingUserRef.current = true;

        try {
            if (withLoader) setLoading(true);
            const res = await axios.get('/access', { withCredentials: true });
            if (res.data.user) {
                setUser({
                    ...res.data.user,
                    active: res.data.access,
                    manager_view_access: res.data.manager_access,
                    did_fetch: false
                });
            }
            setLoading(false);
        } catch (err) {
            if (withLoader) setLoading(false);
            throw new Error(`Authentication failed: ${err.message}`);
        } finally {
            isCheckingUserRef.current = false;
        }
    }, []);

    const logoutUser = useCallback(async () => {
        setLoading(true);
        try {
            document.getElementById('root').classList.remove('staff', 'manager');
            setUser(null);
            await axios.get('/logout', { withCredentials: true });
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkConnection = useCallback(async () => {
        try {
            const response = await axios.get('/ping', { withCredentials: true });
            setAppConfig(prev => ({
                ...prev,
                is_connected: response.data.connected,
                theme: response.data.app_theme || prev.theme,
                palette: response.data.app_palette || prev.palette
            }));
        } catch (error) {
            setAppConfig(prev => ({ ...prev, is_connected: false }));
            throw new Error(`Connection check failed: ${error.message}`);
        }
    }, []);

    const fetchModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules', { withCredentials: true });
            setAppConfig(prev => ({ ...prev, modules: response.data }));
        } catch (error) {
            console.error('Error fetching modules:', error);
            setAppConfig(prev => ({ ...prev, modules: [] }));
        }
    }, []);

    const refreshPages = useCallback(async () => {
        const mapPagesToComponents = (pages) => {
            return pages.map(page => {
                const mappedPage = {
                    ...page,
                    component: componentMap[page.component] || (() => <InWorks title={page.title} icon={page.icon} />)
                };

                if (page.subpages && page.subpages.length > 0) {
                    mappedPage.subpages = mapPagesToComponents(page.subpages);
                }

                return mappedPage;
            });
        };

        try {
            let fetchedPages;
            const res = await axios.get('/pages', { withCredentials: true });

            if (Array.isArray(res.data)) {
                fetchedPages = mapPagesToComponents(res.data);
            } else {
                console.error('Fetched data is not an array:', res.data);
                fetchedPages = [];
            }
            setAppConfig(prev => ({ ...prev, pages: fetchedPages }));
        } catch (error) {
            console.error('Error fetching pages:', error);
            setAppConfig(prev => ({ ...prev, pages: [] }));
        }
    }, []);

    const toggleModule = useCallback(async (id, enabled) => {
        try {
            enabled = !enabled;
            await axios.put(`/modules/${id}`, { enabled }, { withCredentials: true });
            await fetchModules();
            await refreshPages();
        } catch (error) {
            console.error('Error toggling module:', error);
        }
    }, [fetchModules, refreshPages]);

    const toggleView = useCallback(async (toggleValue) => {
        setLoading(true);
        try {
            const result = await axios.post(
                '/manager-view',
                { manager_view: toggleValue },
                { withCredentials: true }
            );
            setUser(prev => prev ? { ...prev, manager_view_enabled: result.data?.manager_view } : null);
            await refreshPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [refreshPages]);

    useEffect(() => {
        const handleConnectionCheck = async () => {
            try {
                await checkConnection();
            } catch (error) {
                console.error(error.name, error.message);
            }
        };

        handleConnectionCheck().then();
        const handleAuth = async () => {
            try {
                await authUser(true);
            } catch (error) {
                console.error(error.name, error.message);
            }
        };

        handleAuth().then();

        const interval = setInterval(handleConnectionCheck, 60000);
        return () => clearInterval(interval);
    }, [checkConnection, authUser]);

    useEffect(() => {
        if (user && user.active && !user.did_fetch) {
            setLoading(true);
            Promise.all([
                fetchModules(),
                (async () => {
                    try {
                        setLoading(true);
                        await refreshPages();
                        setUser(prev => prev ? { ...prev, did_fetch: true } : null);
                    } catch (err) {
                        console.error('Fetch pages error:', err);
                        setAppConfig(prev => ({ ...prev, pages: [] }));
                    }
                })()
            ]).finally(() => setLoading(false));
        }
    }, [user, user?.active, fetchModules, refreshPages]);

    return (
        <AppStatusContext.Provider value={{
            user,
            appConfig,
            loading,
            setLoading,
            authUser,
            logoutUser,
            checkConnection,
            fetchModules,
            toggleModule,
            refreshPages,
            toggleView
        }}>
            {children}
        </AppStatusContext.Provider>
    );
};

export const useAppStatus = () => useContext(AppStatusContext);
export default useAppStatus;