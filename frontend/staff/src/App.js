//FRONTEND/Staff/App.js
import './App.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Portal from './components/Portal';
import Login from './components/Login';
import Reports from './components/Reports';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link} from 'react-router-dom';

const Dashboard = () => <h3><i>User dashboard will be in this place.</i></h3>;
const Schedule = () => <h3>User schedule will be in this place.</h3>;
const Settings = () => <h3>Settings</h3>;

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
        <h1 className='site-logo'>Staff Portal</h1>
        <p>Hi {user?.username || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
        <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
    </div>
);

const Loading = () => (
    <div className='app-loading'>Loading...</div>
);

const App = () => {
    const [user, setUser] = useState(null);
    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleLogin = async () => {
        setLoading(true);
        await checkAuth();
    };

    const checkAuth = async () => {
        try {
            const res = await axios.get('/api/staff/access-check', { withCredentials: true });
            console.log(res.data);
            setUser(res.data.user);
            setAccess(true);
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
    };

    const Logout = () => {
        const navigate = useNavigate();
        useEffect(() => {
            const performLogout = async () => {
                try {
                    await axios.get('/api/staff/logout', { withCredentials: true });
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
        return null; // Render nothing while logging out
    };

    const ManagerPortalRedirect = () => {
        useEffect(() => {
            window.location.href = 'http://localhost:3001';
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
                </Routes>
            </Router>
        )
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<Portal user={user}/>}>
                    <Route index element={<Dashboard />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="logout" element={<Logout />} />
                    <Route path="staff-portal" element={<ManagerPortalRedirect />} />
                    <Route path="not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/staff" />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
            </Routes>
        </Router>
    );

};

export default App;
