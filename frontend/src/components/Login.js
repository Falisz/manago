//FRONTEND/Login.js
import '../Login.css';
import React, { useState } from 'react';
import axios from 'axios';
import { ReactComponent as AppLogo } from '../assets/app-logo.svg';
import { useUser } from '../UserContext';

const Login = () => {
    const { HandleLogin } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', { username, password }, { withCredentials: true });
            if (res.data.user) {
                HandleLogin(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed!');
        }
    };

    return (
        <div className="app-login">
            <AppLogo className='app-logo' />
            <form className='login-form' onSubmit={handleSubmit}>
                <div className='input-field'>
                    <input
                        type="text"
                        placeholder="Login"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <span className="input-icon material-icons">person</span>
                </div>
                <div className='input-field'>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="input-icon material-icons">lock</span>
                </div>
                <button type="submit">Log in</button>
                { error && <p className='error'>{error}</p> }
            </form>
        </div>
    );
};

export default Login;
