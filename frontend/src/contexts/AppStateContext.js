// FRONTEND/contexts/AppStatusContext.js
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import componentMap from "../Components";
import InWorks from "../components/InWorks";
import Cookies from 'js-cookie';

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
    // App's states
    const isCheckingUserRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [appState, setAppState] = useState({
        is_connected: true,
        theme: Cookies.get('theme'),
        style: Cookies.get('style'),
        color: Cookies.get('color'),
        background: Cookies.get('background'),
        modules: [],
        pages: []
    });

    // API Get calls.
    const getUser = useCallback(async () => {
        const response = await axios.get('/auth', { withCredentials: true });
        return response.data.user;
    }, []);

    const getConfig = useCallback(async () => {
        const response = await axios.get('/config', { withCredentials: true });
        const config = response.data;
        Cookies.set('style', config.style);
        Cookies.set('theme', config.theme);
        Cookies.set('color', config.color);
        Cookies.set('background', config.background);
        return config;
    }, []);

    const getConfigOptions = useCallback(async () => {
        const response = await axios.get('/config-options', { withCredentials: true });
        return response.data;
    }, []);

    const getModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules?psthr=true', { withCredentials: true });
            return response.data;
        } catch(err) {
            return [];
        }
    }, []);

    const getPages = useCallback(async () => {
        try {
            const response = await axios.get('/pages?psthr=true', { withCredentials: true });
            return mapPagesToComponents(response.data);
        } catch(err) {
            return [];
        }
    }, []);

    // App's Callbacks
    const authUser = useCallback(async (withLoader = false) => {
        if (isCheckingUserRef.current) return;
        isCheckingUserRef.current = true;
        try {
            if (withLoader) setLoading(true);
            setUser(await getUser());
            setLoading(false);
        } catch (err) {
            if (withLoader) setLoading(false);
            throw new Error(`Authentication failed: ${err.message}`);
        } finally {
            isCheckingUserRef.current = false;
        }
    }, [getUser]);

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

    const refreshConfig = useCallback(async (hasRetried = false) => {
        try {
            setLoading(true);
            const config = await getConfig();
            setAppState(prev => {
                if (
                    prev.is_connected === config.is_connected &&
                    prev.theme === config.theme &&
                    prev.color === config.color &&
                    prev.style === config.style &&
                    prev.background === config.background
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    ...config
                };
            });
        } catch (error) {
            if (!hasRetried) {
                setTimeout(() => {
                    refreshConfig(true);
                }, 5000);
            } else {
                console.error('Refreshing app config error', error);
            }
        } finally {
            setLoading(false);
        }
    }, [getConfig]);

    const checkConnection = useCallback(async () => {
        try {
            const config = await getConfig();
            setAppState(prev => {
                if (prev.is_connected === config.is_connected) { return prev; }
                return {...prev, is_connected: config.is_connected};
            });
        } catch (error) {
            setAppState(prev => ({ ...prev, is_connected: false }));
        }
    }, [getConfig]);

    const refreshModules = useCallback(async () => {
        try {
            const modules = await getModules();
            setAppState(prev => {
                if (prev.modules === modules) { return prev; }
                return {...prev, modules: modules};
            });
        } catch (error) {
            console.error('Error fetching modules:', error);
            setAppState(prev => ({ ...prev, modules: [] }));
        }
    }, [getModules]);

    const refreshPages = useCallback(async () => {
        try {
            const pages = await getPages();
            setAppState(prev => {
                if (prev.pages === pages) { return prev; }
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

    const toggleTheme = useCallback(async(userId, theme_mode) => {
        if (!userId) return null;
        try {
            const result = await axios.put(
                `/user-theme/${userId}`,
                { theme_mode },
                { withCredentials: true }
            );
            setUser(prev => prev ? { ...prev, theme_mode: result.data?.theme_mode } : null);
        } catch (err) {
            console.error('Theme switching error: ', err);
        }
    }, []);

    useEffect(() => {
        checkConnection().then();
        const interval = setInterval(checkConnection, 60000);

        const handleInit = async () => {
            try {
                setUser(await getUser());
                setAppState({
                    ...(await getConfig()),
                    modules: await getModules(),
                    pages: await getPages()
                });
                setLoading(false);
            } catch (error) {
                console.error(error.name, error.message);
            }
        };

        handleInit().then();

        return () => clearInterval(interval);
    }, [checkConnection, getUser, getConfig, getModules, getPages]);

    return (
        <AppStateContext.Provider value={{
            loading,
            setLoading,
            user,
            authUser,
            logoutUser,
            appState,
            getConfigOptions,
            refreshConfig,
            checkConnection,
            refreshModules,
            toggleModule,
            refreshPages,
            toggleView,
            toggleTheme
        }}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = () => useContext(AppStateContext);
export default useAppState;