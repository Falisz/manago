//FRONTEND/Manager/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { ReactComponent as SiteLogo } from '../assets/site-logo.svg';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/manager/login', { username, password }, { withCredentials: true });
            if (res.data.user) {
                onLogin(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed!');
        }
    };

    return (
        <div className="app-login">
            <SiteLogo className='app-logo' />
            <form className='login-form' onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Log in</button>
                { error && <p className='error'>{error}</p> }
            </form>
        </div>
    );
};

export default Login;
