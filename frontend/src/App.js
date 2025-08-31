// FRONTEND/App.js
// MAIN IMPORTS
import React, {useEffect, useMemo} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './assets/styles/App.css';

// APP CONTEXTS
import { ConnectivityProvider, useConnectivity} from './contexts/ConnectivityContext';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppCoreProvider, useAppCore } from './contexts/AppCoreContext';
import { ModalProvider } from './contexts/ModalContext';

// REACT COMPONENTS
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import ConnectivityPopup from './components/ConnectivityPopup';

// TODO: Initialization of the app with system_default theme and cookies for previously saved settings - before they're reloaded from the server.
// TODO: Frontend logic utility for server-sided app config (theme, palette) and app modules - which ones are enabled - teams, branch, project, etc.
// TODO: Custom useAppConfig hook with pages, settings, and server-sided user preferences
// TODO: Implement teams CRUD features. Assignment of teams relations with other teams, branches, projects, users, etc.
// TODO: Different logo per branch (?) e.g. if user is from Branch One they have diff logo than the user from Branch Two.

const AppContent = () => {
    const { loading } = useLoading();
    const { user, access, AuthUser } = useAuth();
    const { appConfig } = useConnectivity();
    const { pages, managerView } = useAppCore();

    useEffect(() => {
        AuthUser();
    }, [AuthUser]);

    useEffect(() => {
        const root = document.getElementById('root');
        root.classList.add(appConfig.theme);
        root.classList.add(appConfig.palette);
    }, [appConfig]);

    const viewClass = useMemo(() => {
        return managerView ? 'manager' : 'staff';
    }, [managerView]);

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
                <Route path="logout" element={ <Logout/> } />
            </Routes>
        );
    }

    const root = document.getElementById('root');
    root.classList.add(viewClass);
    root.classList.remove(viewClass === 'manager' ? 'staff' : 'manager');

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        managerView ? (
                            <ManagerView/>
                        ) : (
                            <StaffView/>
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
                                    {subpage?.subpages?.map((subsubpage) => (
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
                    <Route path="logout" element={ <Logout/> } />
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
                    <AppCoreProvider>
                        <Router>
                            <ModalProvider>
                                <AppContent />
                                <ConnectivityPopup />
                            </ModalProvider>
                        </Router>
                    </AppCoreProvider>
                </AuthProvider>
            </LoadingProvider>
        </ConnectivityProvider>
    );
};

export default App;