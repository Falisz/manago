// FRONTEND/components/NoAccess.jsx
import {Link} from 'react-router-dom';
import useApp from '../contexts/AppContext';
import Icon from './Icon';

export const NoAccess = () => 
    <div className='app-notice app-no-access'>
        <Icon className={'main-icon'} i={'error'} s={true} />
        <p>Hi {useApp()?.user?.first_name || 'there'}, looks like you don't have sufficient permissions to visit this portal.</p>
        <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
    </div>

export default NoAccess;