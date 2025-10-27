// FRONTEND/App.jsx
// MAIN IMPORTS
import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './styles/App.css';

// APP CONTEXTS
import useAppState, { AppStateProvider } from './contexts/AppStateContext';
import { ModalProvider } from './contexts/ModalContext';

// APP COMPONENTS
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import Test from './components/Test';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import ConnectivityPopup from './components/ConnectivityPopup';

const AppContent = () => {
    const { appState, user } = useAppState();

    useEffect(() => {
        const root = document.getElementById('root');

        root.classList.remove(
            'red', 'green', 'blue',
            'cyan', 'magenta', 'yellow',
            'orange', 'lime', 'pink', 'mono',
            'light', 'dark', 'flat', 'fluent'
        );

        root.classList.forEach(cls => {
            if (cls.startsWith('bg-')) {
                root.classList.remove(cls);
            }
        });

        if (appState.style) 
            root.classList.add(appState.style);

        if (user && user.hasOwnPropety('theme_mode') && user.theme_mode != null )
            root.classList.add(user.theme_mode);
        else if (appState.theme)
            root.classList.add(appState.theme);
        
        if (appState.color) 
            root.classList.add(appState.color);

        if (appState.style === 'fluent' && appState.background) 
            root.classList.add('bg-' + appState.background);

    }, [appState, user]);

    if (appState.loading) {
        return <Loader />;
    }

    // console.log("App re-renders.\nCurrently logged-in user:\n", user, "\nCurrently used app-state:\n", appState);

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
                <Route path="*" element={<NoAccess />} />
                <Route path="logout" element={ <Logout /> } />
            </Routes>
        );
    }

    const root = document.getElementById('root');
    const viewClass = user?.manager_view_enabled ? 'manager' : 'staff';
    root.classList.add(viewClass);
    root.classList.remove(viewClass === 'manager' ? 'staff' : 'manager');

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={user?.manager_view_enabled ? <ManagerView /> : <StaffView />}
                >
                    {appState.pages?.map((page) => (
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
                    <Route path='test' element={<Test />} />
                    <Route path="logout" element={ <Logout /> } />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <AppStateProvider>
            <Router>
                <ModalProvider>
                    <AppContent />
                </ModalProvider>
            </Router>
            <ConnectivityPopup />
        </AppStateProvider>
    );
};

export default App;