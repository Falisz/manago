//FRONTEND/common.js
import {Link, useLocation} from "react-router-dom";

export const InWorks = ({ title }) => {
    const location = useLocation();
    return (
        <div className="app-notice app-in-works">
            <span className="main-icon material-symbols-outlined">manufacturing</span>
            <h3>{title}</h3>
            <p>
                This page is under construction. It will be available soon.
            </p>
            { location.pathname !== '/' && <Link to="/">Return to Dashboard</Link>}
        </div>
    )};

export const NotFound = () => {
    const location = useLocation();
    return (
        <div className="app-notice app-not-found">
            <span className="main-icon material-symbols-outlined">error</span>
            <h3>404 - Page Not Found</h3>
            <p>
                The "{location.pathname.split('/').pop()}" page you are trying to access does not exist or you lack the necessary permissions.
            </p>
            <Link to="/">Return to Dashboard</Link>
        </div>
    )
}

export const NoAccess = ({ user }) => (
    <div className="app-notice app-no-access">
        <span className="main-icon material-symbols-outlined">error</span>
        <p>Hi {user?.first_name || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
        <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
    </div>
);

export const Loading = () => (
    <div className='app-loading'>Loading...</div>
);