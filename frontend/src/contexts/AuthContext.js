// FRONTEND/contexts/AuthContext.js
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAppStatus } from './AppStatusContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [access, setAccess] = useState(null);
    const [managerAccess, setManagerAccess] = useState(null);
    const isCheckingRef = useRef(false);
    const { setLoading } = useAppStatus();

    const AuthUser = useCallback(async (withLoader = false) => {
        if (isCheckingRef.current) return;

        isCheckingRef.current = true;

        try {
            if (withLoader) setLoading(true);
            const res = await axios.get('/access', { withCredentials: true });
            if (res.data.user) {
                setUser(res.data.user);
                setAccess(res.data.access);
                setManagerAccess(res.data.manager_access);
            }
            setLoading(false);
        } catch (err) {
            setUser(null);
            setAccess(false);
            setManagerAccess(false);
            if (withLoader) setLoading(false);
            console.error(err);
        } finally {
            isCheckingRef.current = false;
        }

    }, [setLoading]);

    const LogoutUser = async () => {
        setLoading(true);
        try {
            document.getElementById('root').classList.remove('staff', 'manager');
            setUser(null);
            setAccess(false);
            setManagerAccess(false);
            await axios.get('/logout', { withCredentials: true });
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                access,
                managerAccess,
                AuthUser,
                LogoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);