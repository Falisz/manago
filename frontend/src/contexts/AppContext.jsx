// FRONTEND/contexts/AppContext.jsx
import React, { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import AppSettings from '../components/AppSettings';
import ConfirmPrompt from '../components/ConfirmPrompt';
import ConnectivityPopup from '../components/ConnectivityPopup';
import InWorks from '../components/InWorks';
import Modal from "../components/Modal";
import PostDetails from '../components/Posts/Details';
import PostsIndex from '../components/Posts/Index';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import RolesIndex from '../components/Roles/Index';
import SchedulesDashboard from '../components/Schedules/Dashboard';
import ScheduleEdit from '../components/Schedules/Edit';
import ScheduleView from '../components/Schedules/View';
import TeamDetails from '../components/Teams/Details';
import TeamEdit, {TeamUserAssignment, TeamUserBulkAssignment} from '../components/Teams/Edit';
import TeamsIndex from '../components/Teams/Index';
import UserDetails from '../components/Users/Details';
import UserEdit, {
    UserRoleAssignment,
    UserManagerAssignment,
    UserRoleBulkAssignment,
    UserManagerBulkAssignment
} from '../components/Users/Edit';
import UsersIndex, {EmployeesIndex, ManagersIndex} from '../components/Users/Index';

const ANIMATION_DURATION = 300;
const COMPONENT_MAP = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    ScheduleDashboard: SchedulesDashboard,
    ScheduleView,
    ScheduleEdit,
    PostsIndex,
    AppSettings
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
    const appCache = useRef({
        users: {},
        roles: {},
        teams: {},
        shifts: {}
    });
    const [modals, setModals] = useState({});
    const [refreshTriggers, setRefreshTriggers] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState(new Set());
    const [searchParams, setSearchParams] = useSearchParams();
    const { search } = useLocation();
    const isMounted = useRef(false);
    const isCheckingUserRef = useRef(false);
    const nextModalId = useRef(0);
    const modalsRef = useRef({});

    // State and Ref setters
    const setLoading = useCallback((loading) => {
        setAppState(prev => ({ ...prev, loading }));
    }, []);

    const setUser = useCallback((user) => {
        setAppState(prev => ({ ...prev, user: {...prev.user, ...user} }));
    }, []);

    // unsavedChanges state management
    const addUnsavedChange = useCallback((id) => {
        console.log('Adding unsaved change:', id);
        setUnsavedChanges(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const removeUnsavedChange = useCallback((id) => {
        console.log('Removing unsaved change:', id);
        setUnsavedChanges(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const hasUnsavedChanges = unsavedChanges.size > 0;

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
        setLoading(true);
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
        setLoading(false);
    }, [getConfig, setLoading]);

    const saveConfig = useCallback(async (config) => {
        try {
            await axios.put('/config', config, { withCredentials: true });
            await refreshConfig();
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

    const syncUrlWithModals = useCallback((modalsOverride) => {
        const currentModals = modalsOverride || modalsRef.current || {};

        const newParams = new URLSearchParams(search);
        const modalKeys = ['new', 'user', 'editUser', 'role', 'editRole', 'team', 'editTeam', 'post'];
        modalKeys.forEach((k) => newParams.delete(k));

        Object.values(currentModals).forEach((modal) => {
            if (modal.content === 'userNew') newParams.set('new', 'user');
            if (modal.content === 'managerNew') newParams.set('new', 'manager');
            if (modal.content === 'employeeNew') newParams.set('new', 'employee');
            if (modal.content === 'roleNew') newParams.set('new', 'role');
            if (modal.content === 'teamNew') newParams.set('new', 'team');
            if (modal.content === 'test') newParams.set('new', 'test');
            if (modal.content === 'userDetails') newParams.set('user', modal.contentId);
            if (modal.content === 'userEdit') newParams.set('editUser', modal.contentId);
            if (modal.content === 'roleDetails') newParams.set('role', modal.contentId);
            if (modal.content === 'roleEdit') newParams.set('editRole', modal.contentId);
            if (modal.content === 'teamDetails') newParams.set('team', modal.contentId);
            if (modal.content === 'teamEdit') newParams.set('editTeam', modal.contentId);
            if (modal.content === 'postDetails') newParams.set('post', modal.contentId);
        });
        setSearchParams(newParams, { replace: true });
    }, [search, setSearchParams]);

    const openModal = useCallback((modalConfig) => {
        const id = nextModalId.current++;

        setModals((prev) => {
            const isDuplicate = Object.values(prev).some(
                (existing) =>
                    existing.content === modalConfig.content &&
                    existing.contentId === modalConfig.contentId
            );

            if (isDuplicate)
                return prev;

            const next = {
                ...prev,
                [id]: { ...modalConfig, props: modalConfig.props || {}, isVisible: false, discardWarning: false }
            };
            // Sync URL with the upcoming state
            syncUrlWithModals(next);
            return next;
        });

        setTimeout(() => {
            setModals((prev) => ({
                ...prev,
                [id]: { ...prev[id], isVisible: true },
            }));
        }, ANIMATION_DURATION);

        return id;
    }, [syncUrlWithModals]);

    const setDiscardWarning = useCallback((id, value) => {
        setModals((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: { ...prev[id], discardWarning: value },
            };
        });
    }, []);

    const closeModal = useCallback((id) => {
        setModals((prev) => ({
            ...prev,
            [id]: { ...prev[id], isVisible: false },
        }));

        setTimeout(() => {
            setModals((prev) => {
                const { [id]: _, ...rest } = prev;
                // Sync URL after removal
                syncUrlWithModals(rest);
                return rest;
            });
        }, ANIMATION_DURATION);
    }, [syncUrlWithModals]);

    const closeTopModal = useCallback(() => {
        const currentModals = modalsRef.current;
        const ids = Object.keys(currentModals).sort((a, b) => a - b);
        if (ids.length === 0)
            return;

        const topId = ids[ids.length - 1];
        const topModal = currentModals[topId];

        if (topModal?.discardWarning) {
            openModal({
                content: 'confirm',
                type: 'pop-up',
                message: 'Changes were made. Are you sure you want to discard them?',
                onConfirm: () => {
                    setDiscardWarning(topId, false);
                    closeModal(topId);
                },
            });
            return; // Escaping this callback - new pop-up confirmation modal will handle closing from now on.
        }

        closeModal(topId); // Closing the topModal if there is no discardWarning on it.

    }, [closeModal, openModal, setDiscardWarning]);

    const updateModalProps = useCallback((id, newProps) => {
        setModals((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: {
                    ...prev[id],
                    props: { ...prev[id].props, ...newProps },
                },
            };
        });
    }, []);

    const refreshData = useCallback((content, data) => {
        setRefreshTriggers((prev) => ({
            ...prev,
            [content]: { data, timestamp: Date.now() },
        }));
    }, []);

    const renderModalContent = (modal) => {
        switch (modal.content) {
            case 'userDetails':
                return <UserDetails userId={modal.contentId} />;
            case 'userEdit':
                return <UserEdit userId={modal.contentId} />;
            case 'userRoleAssignment':
                return <UserRoleAssignment user={modal.data} />;
            case 'userRoleBulkAssignment':
                return <UserRoleBulkAssignment users={modal.data} />;
            case 'userManagerAssignment':
                return <UserManagerAssignment user={modal.data} />;
            case 'userManagerBulkAssignment':
                return <UserManagerBulkAssignment users={modal.data} />;
            case 'userNew':
                return <UserEdit />;
            case 'employeeNew':
                return <UserEdit preset={'employee'} />;
            case 'managerNew':
                return <UserEdit preset={'manager'} />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.contentId} />;
            case 'roleEdit':
                return <RoleEdit roleId={modal.contentId} />;
            case 'roleNew':
                return <RoleEdit />;
            case 'teamDetails':
                return <TeamDetails teamId={modal.contentId} />;
            case 'teamEdit':
                return <TeamEdit teamId={modal.contentId} />;
            case 'TeamUserAssignment':
                return <TeamUserAssignment team={modal.data} />;
            case 'teamUserBulkAssignment':
                return <TeamUserBulkAssignment teams={modal.data} />;
            case 'teamNew':
                return <TeamEdit />;
            case 'subteamNew':
                return <TeamEdit parentId={modal.parentId} />;
            case 'postDetails':
                return <PostDetails postId={modal.contentId} />;
            case 'confirm':
                return <ConfirmPrompt
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onConfirm2={modal.onConfirm2}
                    confirmLabel={modal.confirmLabel}
                    confirmLabel2={modal.confirmLabel2}
                    cancelLabel={modal.cancelLabel}
                />;
            case 'component':
                return React.createElement(modal.component, modal.props);
            default:
                return <InWorks title={'Unknown Modal'} modal={true} />;
        }
    };

    const parseUrlParams = useCallback(() => {
        const newResource = searchParams.get('new');
        if (newResource === 'manager')
            openModal({ content: 'managerNew' });
        else if (newResource === 'employee')
            openModal({ content: 'employeeNew' });
        else if (newResource === 'user')
            openModal({ content: 'userNew' });
        else if (newResource === 'role')
            openModal({ content: 'roleNew' });
        else if (newResource === 'team')
            openModal({ content: 'teamNew' });
        else if (newResource === 'branch')
            openModal({ content: 'branchNew' });
        else if (newResource === 'project')
            openModal({ content: 'projectNew' });
        else if (newResource === 'post')
            openModal({ content: 'postNew' });
        else if (newResource === 'test')
            openModal({ content: 'test' });

        const userDetails = searchParams.get('user');
        if (userDetails) openModal({ content: 'userDetails', contentId: userDetails, type: 'dialog' });
        const editUser = searchParams.get('editUser');
        if (editUser) openModal({ content: 'userEdit', contentId: editUser });

        const roleDetails = searchParams.get('role');
        if (roleDetails) openModal({ content: 'roleDetails', contentId: roleDetails, type: 'dialog' });
        const editRole = searchParams.get('editRole');
        if (editRole) openModal({ content: 'roleEdit', contentId: editRole });

        const teamDetails = searchParams.get('team');
        if (teamDetails) openModal({ content: 'teamDetails', contentId: teamDetails, type: 'dialog' });
        const editTeam = searchParams.get('editTeam');
        if (editTeam) openModal({ content: 'teamEdit', contentId: editTeam });

        const postDetails = searchParams.get('post');
        if (postDetails) openModal({ content: 'postDetails', contentId: postDetails, type: 'dialog' });
    }, [openModal, searchParams]);

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
        modalsRef.current = modals;

        if (isMounted.current)
            return

        parseUrlParams();
        isMounted.current = true;

    }, [appState, modals, parseUrlParams]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    const appClasses = useMemo(() => {
        let classes = [];

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
        setLoading,
        authUser,
        logoutUser,
        getConfigOptions,
        saveConfig,
        refreshConfig,
        checkConnection,
        refreshModules,
        toggleModule,
        refreshPages,
        toggleView,
        toggleTheme,
        openModal,
        setDiscardWarning,
        closeModal,
        closeTopModal,
        refreshData,
        updateModalProps,
        refreshTriggers,
        addUnsavedChange,
        removeUnsavedChange
    };
    const sortedModalIds = Object.keys(modals).sort((a, b) => a - b);

    return (
        <AppContext.Provider value={exportObject}>
            <div className={appClasses}>
                {children}
                {sortedModalIds.map((id, index) => {
                    const modal = modals[id];
                    return <Modal
                        key={index}
                        type={modal.type}
                        isVisible={modal.isVisible}
                        style={modal.style}
                        zIndex={1000 + index * 10}
                        onClose={closeTopModal}
                    >
                        {renderModalContent(modal)}
                    </Modal>;
                })}
                <ConnectivityPopup />
            </div>
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
export default useApp;