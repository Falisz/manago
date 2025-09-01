// FRONTEND/components/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppCore } from "../contexts/AppCoreContext";

const Logout = ({ onLogout }) => {
    const { LogoutUser: logoutFromContext } = useAuth();
    const { setManagerView, setDidFetch } = useAppCore();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            await logoutFromContext();
            setManagerView(false);
            setDidFetch(false);
            navigate('/', { replace: true });
        };
        performLogout().then();
    }, [logoutFromContext, setManagerView, setDidFetch, navigate, onLogout]);

    return null;
};

export default Logout;