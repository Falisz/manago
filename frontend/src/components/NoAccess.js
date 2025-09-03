//FRONTEND/components/NoAccess.js
import {Link} from "react-router-dom";
import useAppStatus from '../contexts/AppStatusContext';

export const NoAccess = () => {
    const { user } = useAppStatus();

    return (
        <div className="app-notice app-no-access">
            <span className="main-icon material-symbols-outlined">error</span>
            <p>Hi {user?.first_name || 'there'}! Looks like you don't have sufficient permissions to visit this portal.</p>
            <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
        </div>
    );
};

export default NoAccess;