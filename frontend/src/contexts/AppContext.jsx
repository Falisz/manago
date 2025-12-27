// FRONTEND/contexts/AppContext.jsx
import React, { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Button from '../components/Button';
import SchedulesDashboard from '../components/Schedules/Dashboard';
import ScheduleEdit from '../components/Schedules/Edit';
import ScheduleView from '../components/Schedules/View';
import PostsIndex from '../components/Posts/Index';
import AppSettings from '../components/AppSettings';
import LeavesIndex from '../components/Leaves/Index';
import UsersIndex, {EmployeesIndex, ManagersIndex} from '../components/Users/Index';
import RolesIndex from '../components/Roles/Index';
import TeamsIndex from '../components/Teams/Index';
import InWorks from '../components/InWorks';
import PopUps from '../components/PopUps';
import WorkPlannerSettings from '../components/Schedules/Settings';
import setupAxiosInterceptor from "../utils/interceptors";
import ApprovalsIndex from "../components/Approvals/Index";
import ProjectIndex from "../components/Projects/Index";
import OrganizationDashboard from "../components/Organization";

setupAxiosInterceptor();

const COMPONENT_MAP = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    ScheduleDashboard: SchedulesDashboard,
    ScheduleView,
    ScheduleEdit,
    LeavesIndex,
    WorkPlannerSettings,
    PostsIndex,
    AppSettings,
    ApprovalsIndex,
    ProjectIndex,
    OrganizationDashboard
};

const mapPagesToComponents = (pages) => {
    return pages.map(page => {
        const component = COMPONENT_MAP[page.component] || (() => <InWorks title={page.title} icon={page.icon} />);

        const mappedPage = { ...page, component };

        if (page.subpages && page.subpages.length > 0)
            mappedPage.subpages = mapPagesToComponents(page.subpages);

        return mappedPage;
    });
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // App's states
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
    const [popUps, setPopUps] = useState({});
    const nextPopUpId = useRef(1);
    const appCache = useRef({
        users: {},
        roles: {},
        teams: {},
        shifts: {},
        leaves: {},
        jobPosts: {}
    });
    const [refreshTriggers, setRefreshTriggers] = useState({
        users: null,
        teams: null,
        shifts: null,
        leaves: null,
        holidays: null,
        holidayWorkings: null,
        weekendWorkings: null,
        leaveTypes: null,
        jobPosts: null,
        jobLocations: null
    });

    // State and Ref setters
    const setLoading = useCallback((loading) => {
        setAppState(prev => ({ ...prev, loading }));
    }, []);

    const setUser = useCallback((updater) => {
        setAppState(prev => ({ ...prev, user: typeof updater === 'function' ? updater(prev.user) : updater}));
    }, []);

    const showPopUp = useCallback((popUp, life=30000) => {
        const id = nextPopUpId.current++;
        popUp.id = id;
        popUp.isVisible = false;

        setPopUps(prev => {
            return {...prev, [id]: popUp};
        });

        setTimeout(() => {
            setPopUps((prev) => ({
                ...prev,
                [id]: { ...prev[id], isVisible: true },
            }));
        }, 300);

        if (life) {
            setTimeout(() => {
                setPopUps((prev) => ({
                    ...prev,
                    [id]: { ...prev[id], isVisible: false },
                }));
            }, life + 300);

            setTimeout(() => {
                setPopUps((prev) => {
                    const {[id]: _, ...next} = { ...prev };
                    return next;
                })
            }, life + 600);
        }

        return id;
    }, []);

    const killPopUp = useCallback((id) => {
        if (id == null)
            return;

        setPopUps((prev) => ({
            ...prev,
            [id]: { ...prev[id], isVisible: false },
        }));

        setTimeout(() => {
            setPopUps((prev) => {
                const {[id]: _, ...next} = { ...prev };
                return next;
            })
        }, 300);
    }, []);

    const refreshData = useCallback((content, data) => {
        setRefreshTriggers((prev) => ({
            ...prev,
            [content]: { data, timestamp: Date.now() },
        }));
    }, []);

    // API Get calls.
    const getUser = useCallback(async () => {
        const response = await axios.get('/auth');
        return response.data.user;
    }, []);

    const getConfig = useCallback(async () => {
        const response = await axios.get('/config');
        const config = response.data;
        Cookies.set('style', config.style);
        Cookies.set('theme', config.theme);
        Cookies.set('color', config.color);
        Cookies.set('background', config.background);
        return config;
    }, []);

    const getConfigOptions = useCallback(async () => {
        const response = await axios.get('/config-options');
        return response.data;
    }, []);

    const getModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules?psthr=true');
            return response.data;
        } catch(err) {
            return [];
        }
    }, []);

    const getPages = useCallback(async () => {
        try {
            const response = await axios.get('/pages?psthr=true');
            return mapPagesToComponents(response.data);
        } catch(err) {
            return [];
        }
    }, []);

    // App's Callbacks

    const refreshConfig = useCallback(async (hasRetried = false, loading = true) => {
        loading && setLoading(true);
        try {
            const config = await getConfig();
            setAppState(prev => {
                const hasChanged = Object.keys(config).some(key => prev[key] !== config[key]);
                return hasChanged ? { ...prev, ...config } : prev;
            });
        } catch (error) {
            if (!hasRetried) {
                setTimeout(() => {
                    refreshConfig(true);
                }, 5000);
            } else {
                console.error('Refreshing app config error', error);
            }
        }
        loading && setLoading(false);
    }, [getConfig, setLoading]);

    const saveConfig = useCallback(async (config, loading) => {
        try {
            await axios.put('/config', config);
            await refreshConfig(false, loading);
            return true;
        } catch (err) {
            console.error('Error saving config:', err);
            return false;
        }
    }, [refreshConfig])

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

    const refreshUser = useCallback(async () => {
        try {
            const user = await getUser();
            setAppState(prev => {
                if (prev.user === user)
                    return prev;
                return {...prev, user};
            });
        } catch (error) {
            console.error('Error refreshing Logged On User:', error);
        }
    }, getUser);

    const toggleModule = useCallback(async (id, enabled) => {
        try {
            enabled = !enabled;
            await axios.put(`/modules/${id}`, { enabled });
            await refreshModules();
            await refreshPages();
        } catch (error) {
            console.error('Error toggling module:', error);
        }
    }, [refreshModules, refreshPages]);

    const toggleView = useCallback(async (toggleValue) => {
        setLoading(true);
        try {
            const result = await axios.post('/manager-view', { manager_view: toggleValue });
            setUser(prev => ({...prev, manager_view_enabled: result.data?.manager_view }));
            await refreshPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [refreshPages, setLoading, setUser]);

    const toggleTheme = useCallback(async(theme_mode) => {
        try {
            const result = await axios.post(`/user-theme`, { theme_mode });
            setUser(prev => ({...prev, theme_mode: result.data?.theme_mode }));
        } catch (err) {
            console.error('Theme switching error: ', err);
        }
    }, [setUser]);


    const loginUser = useCallback(async (username, password) => {
        setLoading(true);
        try {
            const response = await axios.post('/auth', { username, password });
            const { user, message } = response.data;
            if (user) {
                setUser(user);
                showPopUp({ type: 'success', content: message });
                await refreshModules();
                await refreshPages();
                setLoading(false);
                return { success: true, user };
            }
            setLoading(false);
            return { success: false, message };
        } catch (err) {
            console.error('Login error', err);
            showPopUp({ type: 'error', content: err.response?.data?.message || 'Login failed' });
            setLoading(false);
            return { success: false, message: err.message };
        }
    }, [setUser, showPopUp, refreshModules, refreshPages, setLoading]);

    const logoutUser = useCallback(async () => {
        try {
            const response = await axios.get('/logout');
            const { success, message } = response?.data || {};
            if (!success) {
                showPopUp({type: 'error', content: message || 'Logout failed.'});
                return;
            }
            setUser(null);
            showPopUp({type: 'success', content: message || 'Logout successful!'});
        } catch (err) {
            showPopUp({ type: 'error', content: err.response?.data?.message || 'Logout failed.' });
        }
    }, [setUser, showPopUp]);

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

    useEffect(() => {
        !appState.is_connected && showPopUp({
            type: 'disconnected', 
            header: 'Connection Lost',
            content: <>
                <p>No connection to the server. Please check your network.</p>
                <Button
                    onClick={() => window.location.reload()}
                    label={'Refresh'}
                />
            </>
        }, 0);
                
    }, [appState.is_connected, showPopUp]);

    const appClasses = useMemo(() => {
        let classes = [];

        if (appState.loading)
            classes.push('loading');

        if (!appState.user)
            classes.push('login');

        if (appState.style)
            classes.push(appState.style);

        if (appState.user?.theme_mode != null)
            classes.push(appState.user.theme_mode);
        else if (appState.theme)
            classes.push(appState.theme);

        if (appState.color)
            classes.push(appState.color);

        if (appState.style === 'fluent' && appState.background)
            classes.push(`bg-${appState.background}`);

        if (appState.user)
            classes.push(appState.user.manager_view_enabled ? 'manager' : 'staff');

        return ['app', ...classes].join(' ');
    }, [appState]);

    const exportObject = {
        appState,
        appCache,
        isConnected: appState.is_connected,
        loading: appState.loading,
        user: appState.user,
        pages: appState.pages,
        modules: appState.modules,
        refreshTriggers,
        setLoading,
        showPopUp,
        killPopUp,
        loginUser,
        refreshUser,
        logoutUser,
        getConfigOptions,
        saveConfig,
        refreshConfig,
        checkConnection,
        refreshModules,
        toggleModule,
        refreshPages,
        refreshData,
        toggleView,
        toggleTheme
    };

    return (
        <AppContext.Provider value={exportObject}>
            <div className={appClasses}>
                {children}
                <PopUps popUps={popUps} />
            </div>
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
export default useApp;