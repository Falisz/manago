//FRONTEND/components/NoAccess.js
import {Link} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";

export const NoAccess = () => {
    const { user } = useAuth();

    return (
        <div className="app-notice app-no-access">
            <span className="main-icon material-symbols-outlined">error</span>
            <p>Hi {user?.first_name || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
            <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
        </div>
    );
};

export default NoAccess;