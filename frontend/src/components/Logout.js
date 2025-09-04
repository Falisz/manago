// FRONTEND/components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppState from '../contexts/AppStateContext';

const Logout = ({ onLogout }) => {
    const { logoutUser } = useAppState();
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