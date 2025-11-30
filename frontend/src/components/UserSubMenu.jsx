// FRONTEND/components/UserSubMenu.jsx
import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import useApp from '../contexts/AppContext';
import Icon from './Icon';
import Button from './Button';

const UserSubMenu = () => {
    const { user, toggleView, toggleTheme, logoutUser } = useApp();
    const navigate = useNavigate();

    const new_theme_mode = user?.theme_mode === 'dark' ? 'light' : 'dark';

    const handleLogout = React.useCallback(async () => {
        await logoutUser();
        navigate('/', { replace: true });
    },[logoutUser, navigate]);

    return (
        <nav className='app-sub-menu'>
            <Link
                key='settings'
                className='sub-menu-link'
                to='#'
            >
                Settings
                <Icon i={'settings'} />
            </Link>
            <Link
                key='toggle-theme'
                className='sub-menu-link'
                to='#'
                onClick={() => {
                    toggleTheme(user?.id, new_theme_mode);
                }}
            >
                Switch theme
                <Icon i={`${new_theme_mode}_mode`} />
            </Link>
            {(user.permissions.includes('access-manager-view') || user.permissions.includes('*')) &&
                <Link
                    key='toggle-view'
                    className='sub-menu-link'
                    to='#'
                    onClick={() => toggleView(!user.manager_view_enabled)}
                >
                    {user.manager_view_enabled ? 'Staff View' : 'Manager View'}
                    <Icon i={'view_compact_alt'} />
                </Link>
            }
            <Button
                key='logout'
                className='sub-menu-link logout'
                onClick={handleLogout}
            >
                Logout
                <Icon i={'logout'} />
            </Button>
        </nav>
    );

}

export default UserSubMenu;