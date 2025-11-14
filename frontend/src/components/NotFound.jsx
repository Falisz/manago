// FRONTEND/components/NotFound.jsx
import {Link} from 'react-router-dom';
import Icon from './Icon';

export const NotFound = () => 
    <div className='app-notice app-not-found'>
        <Icon className={'main-icon'} i={'error'} s={true} />
        <h3>404 - Page Not Found</h3>
        <p>
            The page or feature you are trying to access does not exist or you lack the necessary permissions.
        </p>
        <Link to='/'>Return to the homepage</Link>
    </div>

export default NotFound;