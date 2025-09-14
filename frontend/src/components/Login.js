//FRONTEND/Login.js
import '../assets/styles/Login.css';
import React, { useState } from 'react';
import axios from 'axios';
import { ReactComponent as AppLogo } from '../assets/app-logo.svg';
import useAppState from '../contexts/AppStateContext';
import Icon from "./Icon";
import Button from "./Button";

const Login = () => {
    const { authUser } = useAppState();
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
