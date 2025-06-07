//FRONTEND/Manager/App.js
import './App.css';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Portal from './components/Portal';
import Login from './components/Login';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link} from 'react-router-dom';


const Dashboard = () => <h3>Dashboard</h3>;
const ScheduleShow = () => <h3>Show Schedule</h3>;
const ScheduleEdit = () => <h3>Edit Schedule</h3>;
const SchedulePast = () => <h3>Past Schedule</h3>;
const ScheduleNew = () => <h3>New Schedule</h3>;
const PostsShow = () => <h3>Show Posts</h3>;
const PostsNew = () => <h3>New Posts</h3>;
const PostsArchive = () => <h3>Post Archive</h3>;
const EmployeesShow = () => <h3>Show Employees</h3>;
const EmployeesNew = () => <h3>New Employee</h3>;

const NotFound = () => (
    <div className="not-found">
        <h3>404 - Page Not Found</h3>
        <p>The page you are trying to access does not exist or you lack the necessary permissions.</p>
        <p>
            <Link to="/">Return to Dashboard</Link>
        </p>
    </div>
);

const NoAccess = ({ user }) => (
    <div className="app-no-access">
        <h1 className='site-logo'>Manager Portal</h1>
        <p>Hi {user?.username || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
        <p>You can <Link to={'/logout'}>logout</Link> and switch to manager account or go back to the <Link to={'/staff-portal'}>Staff Portal</Link>.</p>
    </div>
);

const Loading = () => (
    <div className='app-loading'>Loading...</div>
);

const componentMap = {
    Dashboard,
    ScheduleShow,
    ScheduleEdit,
    SchedulePast,
    ScheduleNew,
    PostsShow,
    PostsNew,
    PostsArchive,
    EmployeesShow,
    EmployeesNew,
};

const App = () => {
    const [user, setUser] = useState(null);
    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState([]);

    const handleLogin = async () => {
        setLoading(true);
        await checkAuth();
    };

    const checkAuth = useCallback(async () => {
        try {
            const res = await axios.get('/api/manager/access-check', { withCredentials: true });
            setUser(res.data.user);
            setAccess(true);
            await fetchPages();
        } catch (err) {
            if (err.response?.status === 403) {
                setUser(err.response.data?.user || null);
                setAccess(false);
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPages = async () => {
        try {
            const res = await axios.get('/api/manager/pages', { withCredentials: true });

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
                    await axios.get('/api/manager/logout', { withCredentials: true });
                    console.log('Logout successful');
                } catch (err) {
                    console.error('Logout error', err);
                } finally {
                    navigate('/', { replace: true });
                    setUser(null);
                    setAccess(null);
                    setLoading(false);
                }
            };
            performLogout().then();
        }, [navigate]);
        return null;
    };

    const StaffPortalRedirect = () => {
        useEffect(() => {
            window.location.href = 'http://localhost:3000';
        }, []);
        return null;
    };

    useEffect(() => {
        checkAuth().then();
    }, []);

    if (loading) {
        return <Loading />;
    }
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }
    if (!access) {
        return (
            <Router>
                <Routes>
                    <Route path="/" element={<NoAccess user={user} />} />
                    <Route path="logout" element={<Logout />} />
                    <Route path="staff-portal" element={<StaffPortalRedirect />} />
                </Routes>
            </Router>
        )
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Portal user={user} pages={pages} />}>
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
                    <Route path="staff-portal" element={<StaffPortalRedirect />} />
                    <Route path="not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Route>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
            </Routes>
        </Router>
    );

};

export default App;
