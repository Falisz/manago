//FRONTEND/components/InWorks.js
import {Link, useLocation} from "react-router-dom";

export const InWorks = ({ title, icon }) => {
    const location = useLocation();
    return (
        <div className="app-notice app-in-works">
            <span className="main-icon material-symbols-outlined">{icon ? icon : 'manufacturing'}</span>
            <h3>{title}</h3>
            <p>
                This page is under construction. It will be available soon.
            </p>
            { location.pathname !== '/' && <Link to="/">Return to Dashboard</Link>}
        </div>
    )};

export default InWorks;