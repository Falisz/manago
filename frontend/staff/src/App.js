// App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/staff/dashboard', { withCredentials: true });
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogin = (userData) => setUser(userData);

    const handleLogout = async () => {
        try {
            await axios.get('/api/auth/logout', { withCredentials: true });
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setUser(null);
        }
    };

    if (loading) return <div>Loading...</div>;

    return user ? (
        <Dashboard user={user} onLogout={handleLogout} />
    ) : (
        <Login onLogin={handleLogin} />
    );
};

export default App;
