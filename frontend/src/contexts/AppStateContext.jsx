// FRONTEND/contexts/AppStatusContext.jsx
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import componentMap from '../Components';
import InWorks from '../components/InWorks';
import Cookies from 'js-cookie';

const mapPagesToComponents = (pages) => {
    return pages.map(page => {
        const component = componentMap[page.component] || (() => <InWorks title={page.title} icon={page.icon} />);

        const mappedPage = { ...page, component };

        if (page.subpages && page.subpages.length > 0)
            mappedPage.subpages = mapPagesToComponents(page.subpages);

        return mappedPage;
    });
};

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
    // App's states
    const isCheckingUserRef = useRef(false);
    const [appState, setAppState] = useState({
        is_connected: true,
        loading: true,
        theme: Cookies.get('theme') || null,
        style: Cookies.get('style') || null,
        color: Cookies.get('color') || null,
        background: Cookies.get('background') || null,
        modules: [],
        pages: [],
        user: null
    });
    const appCache = useRef({
        users: {},
        roles: {},
        teams: {},
        shifts: {},
        schedule_editor: {}
    });

    // State and Ref setters
    const setLoading = useCallback((loading) => {
        setAppState(prev => ({ ...prev, loading }));
    }, []);

    const setUser = useCallback((user) => {
        setAppState(prev => ({ ...prev, user: {...prev.user, ...user} }));
    }, []);

    const setScheduleEditor = useCallback(async (scheduleEditor) => {
        appCache.current.schedule_editor = scheduleEditor;
    }, []);

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
    }, [setLoading, setUser]);

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
    }, [getConfig, setLoading]);

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
                if (prev.pages === pages)
                    return prev;
                return {...prev, pages};
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
            setUser({ manager_view_enabled: result.data?.manager_view });
            await refreshPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [refreshPages, setLoading, setUser]);

    const toggleTheme = useCallback(async(userId, theme_mode) => {
        if (!userId) return null;
        try {
            const result = await axios.put(
                `/user-theme/${userId}`,
                { theme_mode },
                { withCredentials: true }
            );
            setUser({ theme_mode: result.data?.theme_mode });
        } catch (err) {
            console.error('Theme switching error: ', err);
        }
    }, [setUser]);

    const authUser = useCallback(async (withLoader = false) => {
        if (isCheckingUserRef.current) return;
        isCheckingUserRef.current = true;
        try {
            if (withLoader) 
                setLoading(true);
            setUser(await getUser());
            setLoading(false);
        } catch (err) {
            if (withLoader) 
                setLoading(false);
            throw new Error(`Authentication failed: ${err.message}`);
        } finally {
            isCheckingUserRef.current = false;
            await refreshModules();
            await refreshPages();
        }
    }, [getUser, refreshPages, refreshModules, setLoading, setUser]);

    useEffect(() => {
        checkConnection().then();
        const interval = setInterval(checkConnection, 60000);

        const handleInit = async () => {
            try {
                setAppState({
                    user: await getUser(),
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
    }, [checkConnection, getUser, getConfig, getModules, getPages, setLoading, setUser]);

    return (
        <AppStateContext.Provider value={{
            appState,
            appCache,
            loading: appState.loading,
            user: appState.user,
            setLoading,
            authUser,
            logoutUser,
            getConfigOptions,
            setScheduleEditor,
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