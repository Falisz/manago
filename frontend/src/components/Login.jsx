// FRONTEND/Components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';
import Button from './Button';
import Icon from './Icon';
import '../styles/Login.css';
import { ReactComponent as AppLogo } from '../assets/app-logo.svg';

const Login = () => {
    const { authUser } = useApp();
    const [ username, setUsername] = useState('');
    const [ password, setPassword] = useState('');
    const [ error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/auth', { username, password }, { withCredentials: true });
            await authUser(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed!');
        }
    };

    return (
        <div className='app-login'>
            <div className='login-wrapper'>
                <AppLogo className='app-logo' />
                <form className='login-form see' onSubmit={handleSubmit}>
                    <div className='input-field'>
                        <input
                            type='text'
                            autoComplete='username'
                            placeholder='Login'
                            name='login'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <Icon className='input-icon' i={'person'} />
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
                        <Icon className='input-icon' i={'lock'} />
                    </div>
                    <Button type='submit'>Log in</Button>
                    { error && <p className='error'>{error}</p> }
                </form>
            </div>
        </div>
    );
};

export default Login;
