// FRONTEND/components/NotFound.jsx
import {Link} from 'react-router-dom';
import Icon from './Icon';

export const NotFound = ({title = '404 - Page Not Found', description, linkPath, linkLabel}) =>
    <div className='app-notice app-not-found'>
        <Icon className={'main-icon'} i={'error'} s={true} />
        <h3>{title}</h3>
        <p>
            {description ||
                'The page or feature you are trying to access does not exist or you lack the necessary permissions.'}
        </p>
        <Link to={linkPath ?? '/'}>{linkLabel ?? 'Return to the homepage'}</Link>
    </div>

export default NotFound;