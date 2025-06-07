//FRONTEND/Staff/Portal.js
import React from 'react';
import {Link, Outlet} from 'react-router-dom';

const Portal = ({user}) => {
    return (
        <div className="app">
            <div className="app-header">
                <nav className="app-nav">
                    <Link to="/"><h1 className='site-logo'>Staff Portal</h1></Link>
                    <Link to="/schedule">Schedule</Link>
                    <Link to="/reports">Reports</Link>
                    <Link to="/settings">Settings</Link>
                </nav>
                <div className='user-nav'>
                    <span className='username'>
                        {user?.username || 'User'}
                    </span>
                    <i className="material-icons">keyboard_arrow_down</i>
                    <ul className='submenu'>
                        { user.role === 2 ?
                            <li className='submenu-item'>
                                <a className='goToStaff' href="http://localhost:3001">Go to Manager Portal</a>
                            </li> : null }
                        <li className='submenu-item'>
                            <Link  to='/logout' className='logout'>Logout</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="app-content">
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Portal;
