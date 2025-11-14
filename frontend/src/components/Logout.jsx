// FRONTEND/Components/Logout.jsx
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import useApp from '../contexts/AppContext';

const Logout = ({ onLogout }) => {
    const { logoutUser } = useApp();
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