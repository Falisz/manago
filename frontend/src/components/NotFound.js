//FRONTEND/components/NotFound.js
import {Link, useLocation} from "react-router-dom";

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

export default NotFound;