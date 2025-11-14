// FRONTEND/App.jsx
import React from 'react';
import {BrowserRouter as AppRouter, Routes, Route} from 'react-router-dom';
import useApp, { AppProvider as AppContext } from './contexts/AppContext';
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import Test from './components/Test';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import './styles/App.css';

const AppRoutes = () => {
    const { user, loading, pages } = useApp();

    if (loading)
        return <Loader />;

    if (!user)
        return (
            <Routes>
                <Route path="*" element={<Login />} />
            </Routes>
        );

    if (!user.active) {
        return (
            <Routes>
                <Route path="*" element={<NoAccess />} />
                <Route path="logout" element={ <Logout /> } />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route
                path="/"
                element={user?.manager_view_enabled ? <ManagerView /> : <StaffView />}
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
                <Route path='test' element={<Test />} />
                <Route path="logout" element={ <Logout /> } />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
};

const App = () => {
    return (
        <AppRouter>
            <AppContext>
                <AppRoutes/>
            </AppContext>
        </AppRouter>
    );
};

export default App;