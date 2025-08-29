// FRONTEND/App.js
// MAIN IMPORTS
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './assets/styles/App.css';
import {ConnectivityProvider, useConnectivity} from './contexts/ConnectivityContext';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext'; // NEW: Import ModalProvider

// COMPONENTS
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import ConnectivityPopup from './components/ConnectivityPopup';
import FetchPages from "./utils/fetchPages";
import ToggleManagerView from "./utils/toggleManagerView";

const theme = process.env['REACT_APP_THEME'] || 'dark';
const color = process.env['REACT_APP_COLOR'] || 'blue';

// TODO: Initialization of the app with system_default theme and cookies for previously saved settings - before they're reloaded from the server.
// TODO: Frontend logic utility for server-sided app config (theme, palette) and app modules - which ones are enabled - teams, branch, project, etc.
// TODO: Custom useAppConfig hook with pages, settings, and server-sided user preferences
// TODO: Implement teams CRUD features. Assignment of teams relations with other teams, branches, projects, users, etc.

const AppContent = () => {
    const { loading, setLoading } = useLoading();
    const { user, access, managerAccess, AuthUser } = useAuth();
    const { isConnected } = useConnectivity();
    const [ pages, setPages ] = useState(null);
    const [ managerView, setManagerView ] = useState(false);
    const didFetchRef = useRef(false);

    const RefreshPages = useCallback(async () => {
        if (!isConnected) {
            throw new Error('No connection; cannot fetch pages.');
        }
        return await FetchPages();
    }, [isConnected]);

    const ToggleView = useCallback(async (isManagerView) => {
        setLoading(true);
        try {
            setManagerView(await ToggleManagerView(isManagerView));
            setPages(await RefreshPages());
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [setLoading, RefreshPages]);

    // Effect 1: Check auth on mount (handles already-logged-in user)
    useEffect(() => {
        AuthUser();
    }, [AuthUser]);

    // Effect 2: Fetch pages and set managerView when user/access become available (post-login or initial)
    useEffect(() => {
        const fetchIfAuthorized = async () => {
            if (!user || !access || didFetchRef.current) return;

            try {
                setLoading(true);
                setManagerView(managerAccess && user?.manager_view_enabled);
                setPages(await RefreshPages());
                didFetchRef.current = true;
            } catch (err) {
                console.error('Fetch pages error:', err);
                setPages([]);
            } finally {
                setLoading(false);
            }
        };
        fetchIfAuthorized().then();
    }, [user, access, managerAccess, RefreshPages, setLoading]);

    const viewClass = useMemo(() => {
        return managerView ? 'manager' : 'staff';
    }, [managerView]);

    const root = document.getElementById('root');
    root.classList.add(theme);
    root.classList.add(color);

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return (
            <Routes>
                <Route path="*" element={<Login />} />
            </Routes>
        );
    }

    if (!access) {
        return (
            <Routes>
                <Route path="*" element={<NoAccess user={user} />} />
                <Route path="/logout" element={<Logout onLogout={() => {setManagerView(false); didFetchRef.current = false;}} />} />
            </Routes>
        );
    }
    root.classList.add(viewClass);
    root.classList.remove(viewClass === 'manager' ? 'staff' : 'manager');

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        managerView ? (
                            <ManagerView pages={pages} switchView={ToggleView}/>
                        ) : (
                            <StaffView pages={pages} switchView={ToggleView}/>
                        )
                    }
                >
                    {pages?.map((page) => (
                        <Route key={page.path} path={page.path}>
                            <Route
                                index
                                element={page.component ? React.createElement(page.component) : <NotFound />}
                            />
                            {page?.subpages?.map((subpage) => (
                                <Route
                                    key={`${page.path}/${subpage.path}` || subpage.title}
                                    path={subpage.path ? `${subpage.path}` : ''}
                                    index={!subpage.path}
                                    element={subpage.component ? React.createElement(subpage.component) : <NotFound />}
                                >
                                    {subpage.subpages.map((subsubpage) => (
                                        <Route
                                            key={`${page.path}/${subpage.path}/${subsubpage.path}` || subsubpage.title}
                                            path={subsubpage.path ? `${subsubpage.path}` : ''}
                                            index={!subsubpage.path}
                                            element={subsubpage.component ? React.createElement(subsubpage.component) : <NotFound />}
                                        />
                                    ))}
                                </Route>
                            ))}
                        </Route>
                    ))}
                    <Route
                        path="logout"
                        element={ <Logout onLogout={ () => { setManagerView(false); didFetchRef.current = false; } }/> }
                    />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <ConnectivityProvider>
            <LoadingProvider>
                <AuthProvider>
                    <Router>
                        <ModalProvider>
                            <AppContent />
                            <ConnectivityPopup />
                        </ModalProvider>
                    </Router>
                </AuthProvider>
            </LoadingProvider>
        </ConnectivityProvider>
    );
};

export default App;