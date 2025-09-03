// FRONTEND/App.js
// MAIN IMPORTS
import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './assets/styles/App.css';

// APP CONTEXTS
import useAppStatus, { AppStatusProvider } from './contexts/AppStatusContext';
import { ModalProvider } from './contexts/ModalContext';

// APP COMPONENTS
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import ConnectivityPopup from './components/ConnectivityPopup';

// TODO: Initialization of the app with system_default theme and cookies for previously saved settings - before they're reloaded from the server.
// TODO: Different logo per branch (?) e.g. if user is from Branch One they have diff logo than the user from Branch Two.

const AppContent = () => {
    const { loading, appConfig, user } = useAppStatus();

    useEffect(() => {
        const root = document.getElementById('root');
        root.classList.add(appConfig.theme);
        root.classList.add(appConfig.palette);
    }, [appConfig]);

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

    if (!user.active) {
        return (
            <Routes>
                <Route path="*" element={<NoAccess user={user} />} />
                <Route path="logout" element={ <Logout/> } />
            </Routes>
        );
    }

    const viewClass = user?.manager_view_enabled ? 'manager' : 'staff';
    const root = document.getElementById('root');
    root.classList.add(viewClass);
    root.classList.remove(viewClass === 'manager' ? 'staff' : 'manager');

    console.log("App re-renders.\nCurrently logged-in user:\n", user, "\nCurrently used app-config:\n", appConfig);

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        user?.manager_view_enabled ? (
                            <ManagerView/>
                        ) : (
                            <StaffView/>
                        )
                    }
                >
                    {appConfig.pages?.map((page) => (
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
        <AppStatusProvider>
            <Router>
                <ModalProvider>
                    <AppContent />
                </ModalProvider>
            </Router>
            <ConnectivityPopup />
        </AppStatusProvider>
    );
};

export default App;