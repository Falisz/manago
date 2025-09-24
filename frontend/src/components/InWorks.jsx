// FRONTEND/Components/InWorks.jsx
import {Link, useLocation} from 'react-router-dom';
import {useModals} from '../contexts/ModalContext';
import Icon from './Icon';

export const InWorks = ({ title, icon, description = null, modal = false }) => {
    const location = useLocation();
    const { closeTopModal } = useModals();
    return (
        <div className='app-notice app-in-works'>
            <Icon className={'main-icon'} i={icon ? icon : 'manufacturing'} s={true} />
            <h3>{title}</h3>
            <p> This { modal ? 'feature' : 'page' } is under construction. It will be available soon. </p>
            { description && <p style={{ width: '66%' }}>{description}</p> }
            { modal ? <Link to={'#'} onClick={() => closeTopModal()}>Go back.</Link> : (location.pathname !== '/' && <Link to='/'>Return to Dashboard.</Link>)}
        </div>
    )};

export default InWorks;