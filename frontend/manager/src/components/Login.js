//FRONTEND/Manager/Login.js
import React, { useState } from 'react';
import axios from 'axios';

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
            <h1 className='site-logo'>Manager Portal</h1>
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
                <p className='error'>{error}</p>
                <button type="submit">Log in</button>
            </form>
        </div>
    );
};

export default Login;
