//FRONTEND/App.js
// MAIN IMPORTS
import React, {useState, useEffect, useCallback} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './assets/styles/App.css';
import { ConnectivityProvider } from './contexts/ConnectivityContext';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

const AppContent = () => {
    const { loading, setLoading } = useLoading();
    const { user, access, CheckAccess } = useAuth();
    const [ pages, setPages ] = useState(null);
    const [ managerView, setManagerView ] = useState(null);

    const RefreshPages = useCallback(async () => {
        try {
            setLoading(true);
            setPages(await FetchPages());
        } catch (err) {
            console.error('Error fetching pages:', err);
            setPages([]);
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    const ToggleView = useCallback(async (isManagerView) => {
        try {
            setLoading(true);
            setManagerView(await ToggleManagerView(isManagerView));
            await RefreshPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [setLoading, RefreshPages]);

    useEffect(() => {
        document.getElementById('root').classList.add(theme);
        document.getElementById('root').classList.add(color);
        setLoading(true);
        CheckAccess().then();
    }, [setLoading, CheckAccess]);

    useEffect(() => {
        if (!pages)
            RefreshPages().then();
    }, [pages, RefreshPages]);

    useEffect(() => {
        setManagerView(user?.manager_view_enabled || false);
    }, [user]);

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <Login />;
    }

    if (managerView) {
        document.getElementById('root').classList.add('manager');
        document.getElementById('root').classList.remove('staff');
    } else {
        document.getElementById('root').classList.add('staff');
        document.getElementById('root').classList.remove('manager');
    }

    if (!access) {
        return (
            <>
                <Routes>
                    <Route path="*" element={<Navigate to="/" replace />} />
                    <Route path="/" element={<NoAccess user={user} />} />
                    <Route
                        path="logout"
                        element={
                            <Logout
                                onLogout={() => {
                                    setManagerView(false);
                                    setLoading(false);
                                }}
                            />
                        }
                    />
                </Routes>
            </>
        );
    }

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
                    {pages.map((page) => (
                        <Route key={page.path} path={page.path}>
                            <Route
                                index
                                element={page.component ? React.createElement(page.component) : <NotFound />}
                            />
                            {page.subpages.map((subpage) => (
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
                        element={ <Logout onLogout={ () => { setManagerView(false); } }/> }
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
                        <AppContent />
                        <ConnectivityPopup />
                    </Router>
                </AuthProvider>
            </LoadingProvider>
        </ConnectivityProvider>
    );
};

export default App;
