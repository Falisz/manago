// FRONTEND/components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

const Logout = ({ onLogout }) => {
    const { Logout: logoutFromContext } = useUser();
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