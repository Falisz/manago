// FRONTEND/UserContext.js
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLoading } from './LoadingContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [access, setAccess] = useState(null);
    const [managerAccess, setManagerAccess] = useState(null);
    const isCheckingRef = useRef(false);
    const { setLoading } = useLoading();

    const CheckAccess = useCallback(async () => {
        if (isCheckingRef.current) return;

        isCheckingRef.current = true;

        try {
            const res = await axios.get('/access', { withCredentials: true });
            console.log("Checked access", res);
            setAccess(res.data.access);
            setUser(res.data.user);
            setManagerAccess(res.data.manager_access);
        } catch (err) {
            setAccess(false);
            setManagerAccess(false);
            setUser(null);
            console.error(err);
        } finally {
            isCheckingRef.current = false;
        }

    }, []);

    const Login = async (userData) => {
        setLoading(true);
        try {
            setUser(userData);
            await CheckAccess();
        } catch (err) {
            console.error('Login error', err);
        } finally {
            setLoading(false);
        }
    };

    const Logout = async () => {
        setLoading(true);
        try {
            document.getElementById('root').classList.remove('staff', 'manager');
            await axios.get('/logout', { withCredentials: true });
            setUser(null);
            setAccess(false);
            setManagerAccess(false);
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        CheckAccess().then();
    }, [CheckAccess]);

    return (
        <UserContext.Provider
            value={{
                user,
                access,
                managerAccess,
                Login,
                Logout,
                CheckAccess,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);