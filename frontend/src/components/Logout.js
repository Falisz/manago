// FRONTEND/components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStatus from '../contexts/AppStatusContext';

const Logout = ({ onLogout }) => {
    const { logoutUser } = useAppStatus();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            await logoutUser();
            navigate('/', { replace: true });
        };
        performLogout().then();
    }, [logoutUser, navigate, onLogout]);

    return null;
};

export default Logout;