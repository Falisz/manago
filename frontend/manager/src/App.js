//FRONTEND/Manager/App.js
import './App.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Portal from './components/Portal';
import Login from './components/Login';
import {Header, Footer, NoAccess, Loading} from "./components/Common";

const App = () => {
    const [user, setUser] = useState(null);
    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await axios.get('/api/manager/access-check', { withCredentials: true });
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

    useEffect(() => {
        checkAuth();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        await checkAuth();
    };

    const handleLogout = async () => {
        try {
            await axios.get('/api/manager/logout', { withCredentials: true });
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setUser(null);
            setAccess(null);
            setLoading(false);
        }
    };

    let content;

    if (loading) {
        content = <Loading/>;
    } else if (!user) {
        content = <Login onLogin={handleLogin} />;
    } else if (!access) {
        content = <NoAccess onLogout={handleLogout} />;
    } else {
        content = <Portal />;
    }

    return (
        <div className="app">
            <Header user={user} onLogout={handleLogout} />
            <main>{content}</main>
            <Footer />
        </div>
    );

};

export default App;
