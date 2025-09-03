//FRONTEND/Login.js
import '../assets/styles/Login.css';
import React, { useState } from 'react';
import axios from 'axios';
import { ReactComponent as AppLogo } from '../assets/app-logo.svg';
import useAppStatus from '../contexts/AppStatusContext';

const Login = () => {
    const { authUser } = useAppStatus();
    const [ username, setUsername] = useState('');
    const [ password, setPassword] = useState('');
    const [ error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/login', { username, password }, { withCredentials: true });
            await authUser(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed!');
        }
    };

    return (
        <div className='app-login'>
            <AppLogo className='app-logo' />
            <form className='login-form' onSubmit={handleSubmit}>
                <div className='input-field'>
                    <input
                        type='text'
                        autoComplete='username'
                        placeholder='Login'
                        name='login'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <span className='input-icon material-icons'>person</span>
                </div>
                <div className='input-field'>
                    <input
                        type='password'
                        autoComplete='current-password'
                        placeholder='Password'
                        name='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className='input-icon material-icons'>lock</span>
                </div>
                <button type='submit'>Log in</button>
                { error && <p className='error'>{error}</p> }
            </form>
        </div>
    );
};

export default Login;
