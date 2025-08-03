// FRONTEND/components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logout = ({ onLogout }) => {
    const { Logout: logoutFromContext } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            await logoutFromContext();
            onLogout();
            navigate('/', { replace: true });
        };
        performLogout().then();
    }, [logoutFromContext, navigate, onLogout]);

    return null;
};

export default Logout;