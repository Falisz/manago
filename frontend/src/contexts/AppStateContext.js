// FRONTEND/contexts/AppStatusContext.js
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import axios from 'axios';

import componentMap from "../Components";
import InWorks from "../components/InWorks";

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

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
    // TODO: Retry merging all three states into an [appState and setAppState] = useState();
    // TODO: Initialization of the app with system_default theme and cookies for previously saved settings -
    //  before they're reloaded from the server.

    const isCheckingUserRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [appState, setAppState] = useState({
        is_connected: true,
        is_loading: true,
        theme: process.env['REACT_APP_THEME'] || 'dark',
        palette: process.env['REACT_APP_COLOR'] || 'blue',
        user: null,
        modules: [],
        pages: []
    });

    const checkAccess = useCallback(async () => {
        const response = await axios.get('/access', { withCredentials: true });
        return response.data.user;
    }, []);

    const authUser = useCallback(async (withLoader = false) => {
        if (isCheckingUserRef.current) return;
        isCheckingUserRef.current = true;
        try {
            if (withLoader) setLoading(true);
            const user = await checkAccess();
            setUser(user);
            setLoading(false);
        } catch (err) {
            if (withLoader) setLoading(false);
            throw new Error(`Authentication failed: ${err.message}`);
        } finally {
            isCheckingUserRef.current = false;
        }
    }, [checkAccess]);

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

    const getConfig = useCallback(async () => {
        const response = await axios.get('/config', { withCredentials: true });
        return response.data;
    }, [])

    const refreshConfig = useCallback(async () => {
        try {
            const config = await getConfig();
            setAppState(prev => {
                if (
                    prev.is_connected === config.is_connected &&
                    prev.theme === config.app_theme &&
                    prev.palette === config.app_palette
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    is_connected: config.connected,
                    theme: config.app_theme || prev.theme,
                    palette: config.app_palette || prev.palette
                };
            });
        } catch (error) {
            console.error('Refreshing app config error', error);
        }
    }, [getConfig]);

    const checkConnection = useCallback(async () => {
        try {
            const config = await getConfig();
            setAppState(prev => {
                if (prev.is_connected === config.is_connected) {return prev;}
                return {...prev, is_connected: config.is_connected};
            });
        } catch (error) {
            setAppState(prev => ({ ...prev, is_connected: false }));
        }
    }, [getConfig]);

    const getModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules?psthr=true', { withCredentials: true });
            return response.data;
        } catch(err) {
            return [];
        }
    }, [])

    const refreshModules = useCallback(async () => {
        try {
            const modules = await getModules();
            setAppState(prev => {
                if (prev.modules === modules) {return prev;}
                return {...prev, modules: modules};
            });
        } catch (error) {
            console.error('Error fetching modules:', error);
            setAppState(prev => ({ ...prev, modules: [] }));
        }
    }, [getModules]);

    const getPages = useCallback(async () => {
        try {
            const response = await axios.get('/pages?psthr=true', { withCredentials: true });
            return mapPagesToComponents(response.data);
        } catch(err) {
            return [];
        }
    }, [])

    const refreshPages = useCallback(async () => {
        try {
            const pages = await getPages();
            setAppState(prev => {
                if (prev.pages === pages) {return prev;}
                return {...prev, pages: pages};
            });

        } catch (error) {
            console.error('Error fetching pages:', error);
            setAppState(prev => ({ ...prev, pages: [] }));
        }
    }, [getPages]);

    const toggleModule = useCallback(async (id, enabled) => {
        try {
            enabled = !enabled;
            await axios.put(`/modules/${id}`, { enabled }, { withCredentials: true });
            await refreshModules();
            await refreshPages();
        } catch (error) {
            console.error('Error toggling module:', error);
        }
    }, [refreshModules, refreshPages]);

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
        checkConnection().then();
        const interval = setInterval(checkConnection, 60000);

        const handleInit = async () => {
            try {
                const user = await checkAccess();
                setUser(user);
                const appConfig = await getConfig();
                const pages = await getPages();
                const modules = await getModules();
                setAppState({ ...appConfig, modules: modules, pages: pages });
                setLoading(false);
            } catch (error) {
                console.error(error.name, error.message);
            }
        };

        handleInit().then();

        return () => clearInterval(interval);
    }, [checkAccess, checkConnection, getConfig, getModules, getPages]);

    return (
        <AppStateContext.Provider value={{
            loading,
            setLoading,
            user,
            authUser,
            logoutUser,
            appState,
            refreshConfig,
            checkConnection,
            refreshModules,
            toggleModule,
            refreshPages,
            toggleView
        }}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = () => useContext(AppStateContext);
export default useAppState;