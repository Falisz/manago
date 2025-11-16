// FRONTEND/App.jsx
import React, { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import useApp, { AppProvider } from './contexts/AppContext';
import { NavProvider } from './contexts/NavContext';
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import Test from './components/Test';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import './styles/App.css';

const AppContent = () => {
    const { user, loading, pages } = useApp();

    const router = useMemo(() => {
        let routes;
        if (!user) {
            routes = [
                { path: "*", element: <Login /> }
            ];
        } else if (!user.active) {
            routes = [
                { path: "*", element: <NoAccess /> },
                { path: "logout", element: <Logout /> }
            ];
        } else {
            routes = [
                {
                    path: "/",
                    element: <NavProvider>{user?.manager_view_enabled ? <ManagerView /> : <StaffView />}</NavProvider>,
                    children: [
                        ...pages?.map((page) => ({
                            path: page.path,
                            children: [
                                {
                                    index: true,
                                    element: page.component ? React.createElement(page.component) : <NotFound />
                                },
                                ...(page?.subpages?.map((subpage) => ({
                                    path: subpage.path ? `${subpage.path}` : undefined,
                                    index: !subpage.path,
                                    element: subpage.component ? React.createElement(subpage.component) : <NotFound />,
                                    children: subpage?.subpages?.map((subsubpage) => ({
                                        path: subsubpage.path ? `${subsubpage.path}` : undefined,
                                        index: !subsubpage.path,
                                        element: subsubpage.component ? React.createElement(subsubpage.component) : <NotFound />
                                    })) || []
                                })) || [])
                            ]
                        })),
                        { path: 'test', element: <Test /> },
                        { path: "logout", element: <Logout /> },
                        { path: "*", element: <NotFound /> }
                    ]
                }
            ];
        }
        return createBrowserRouter(routes);
    }, [user, pages]);

    if (loading)
        return <Loader />;

    return <RouterProvider router={router} />;
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;