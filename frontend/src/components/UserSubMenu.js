// FRONTEND/components/UserSubMenu.js
import React from 'react';
import useAppState from "../contexts/AppStateContext";
import {Link} from "react-router-dom";
import Icon from "./Icon";

const UserSubMenu = () => {
    const { user, toggleView, toggleTheme } = useAppState();

    const new_theme_mode = user?.theme_mode === 'dark' ? 'light' : 'dark';

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
            { user.manager_view_access &&
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
            <Link
                key='logout'
                className='sub-menu-link logout'
                to='/logout'
            >
                Logout
                <Icon i={'logout'} />
            </Link>
        </nav>
    );

}

export default UserSubMenu;