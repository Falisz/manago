//FRONTEND/Staff/App.js
import './App.css';
import React, { useEffect, useState, useCallback } from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import Portal from './components/Portal';
import ManagerPortal from './components/Portal';
import Login from './components/Login';

const Dashboard = () => <InWorks title={'Dashboard'}/>;
const Schedule = () => <InWorks title={'Schedule'}/>;
const Posts = () => <InWorks title={'Forum'}/>;
const Trainings = () => <InWorks title={'Trainings'}/>;
const Dispositions = () => <InWorks title={'Dispositions Dispositions'}/>;

const InWorks = ({ title }) => (
    <div className="app-in-works">
        <span className="main-icon material-symbols-outlined">manufacturing</span>
        <h3>{title}</h3>
        <p>
            This page is under construction. It will be available soon.
        </p>
        <Link to="/">Return to Dashboard</Link>
    </div>
);

const NotFound = () => (
    <div className="app-not-found">
        <span className="main-icon material-symbols-outlined">error</span>
        <h3>404 - Page Not Found</h3>
        <p>
            The page you are trying to access does not exist or you lack the necessary permissions.
        </p>
        <Link to="/">Return to Dashboard</Link>
    </div>
)

// const NoAccess = ({ user }) => (
//     <div className="app-no-access">
//         <span className="main-icon material-symbols-outlined">error</span>
//         <p>Hi {user?.username || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
//         <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
//     </div>
// );

const Loading = () => (
    <div className='app-loading'>Loading...</div>
);

const componentMap = {
    Dashboard,
    Schedule,
    Posts,
    Trainings,
    Dispositions,
};

const App = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [pages, setPages] = useState([]);

    const handleLogin = async (user) => {
        setLoading(true);
        setUser(user);
        await fetchPages();
        setLoading(false);
    };

    const checkAuth = useCallback(async () => {
        try {
            const res = await axios.get('/api/access', { withCredentials: true });
            setUser(res.data.user);
            await fetchPages();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, []);

    const fetchPages = async () => {
        try {
            const res = await axios.get('/api/pages', {withCredentials: true});

            if (!Array.isArray(res.data)) {
                setPages([]);
                return;
            }

            const mappedPages = res.data.map((page) => ({
                ...page,
                ...(page.component ? {component: componentMap[page.component] || NotFound } : {}),
                subpages: page.subpages.map((subpage) => ({
                    ...subpage,
                    component: componentMap[subpage.component] || NotFound,
                })),
            }));

            setPages(mappedPages);
        } catch (err) {
            console.error('Error fetching pages:', err);
            setPages([]);
        }
    };

    const Logout = () => {
        const navigate = useNavigate();
        useEffect(() => {
            const performLogout = async () => {
                try {
                    await axios.get('/api/logout', { withCredentials: true });
                } catch (err) {
                    console.error('Logout error', err);
                } finally {
                    navigate('/', { replace: true });
                    setUser(null);
                    setLoading(false);
                }
            };
            performLogout().then();
        }, [navigate]);
        return null;
    };

    const SwitchView = (val) => {
      useEffect(() => {
          const performViewSwitch = async () => {
              try {
                  const res = await axios.get('/api/manager-access', { withCredentials: true });
                  if (res.data.access) {
                      user.manager_view = val;
                      await axios.get('/api/manager-view', { withCredentials: true });
                  }
              } catch (err) {
                console.error('View Switching error', err);
                  user.manager_view = false;
              }
          }
          performViewSwitch().then();
      });
      return null;
    };

    const ManagerPortalRedirect = () => {
        useEffect(() => {
            window.location.href = 'http://localhost:3001';
        }, []);
        return null;
    };

    useEffect(() => {
        checkAuth().then();
    }, [checkAuth]);



    if (loading) {
        return <Loading />;
    }
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={user.manager_view ? <ManagerPortal user={user} pages={pages} view={SwitchView}/> : <Portal user={user} pages={pages} view={SwitchView}/>}>
                    {pages
                        .filter((page) => user.role >= page.minRole)
                        .map((page) =>
                            page.component ? (
                                <Route
                                    key={page.path}
                                    path={page.path}
                                    element={<page.component />}
                                    index={page.path === '/'}
                                />
                            ) : (
                                <Route key={page.path} path={page.path}>
                                    {page.subpages
                                        .filter((subpage) => user.role >= subpage.minRole)
                                        .map((subpage) => (
                                            <Route
                                                key={`${page.path}/${subpage.path}`}
                                                path={subpage.path}
                                                index={subpage.path === ''}
                                                element={<subpage.component />}
                                            />
                                        ))}
                                </Route>
                            )
                        )}
                    <Route path="logout" element={<Logout />} />
                    <Route path="manager-portal" element={<ManagerPortalRedirect />} />
                    <Route path="not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Route>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
            </Routes>
        </Router>
    );
};

export default App;
