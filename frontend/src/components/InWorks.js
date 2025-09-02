//FRONTEND/components/InWorks.js
import {Link, useLocation} from "react-router-dom";
import {useModals} from "../contexts/ModalContext";

export const InWorks = ({ title, icon, description = null, modal = false }) => {
    const location = useLocation();
    const { closeTopModal } = useModals();
    return (
        <div className="app-notice app-in-works">
            <span className="main-icon material-symbols-outlined">{icon ? icon : 'manufacturing'}</span>
            <h3>{title}</h3>
            <p>
                This page is under construction. It will be available soon.
            </p>
            { description && <p style={{ width: '66%' }}>{description}</p> }
            { modal ? (<Link onClick={() => closeTopModal()}>Go back.</Link>) : (location.pathname !== '/' && <Link to="/">Return to Dashboard.</Link>)}
        </div>
    )};

export default InWorks;