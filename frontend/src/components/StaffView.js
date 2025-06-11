//FRONTEND/StaffView.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/staff-logo.svg';

const StaffView = ({ user, pages, switchView, hasManagerAccess }) => {
    const location = useLocation();

    return (
        <div className="app">
            <div className="app-header">
                <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogo class={'app-logo'}/>
                </Link>
                <nav className="app-nav">
                    {pages
                        .filter((page) => user.role >= page.minRole)
                        .filter((page) => page.path !== "/")
                        .map((page) => (
                            <div key={page.path} className={'page-link-item'}>
                            <Link
                                key={page.path}
                                to={page.path}
                                className={`page-link ${
                                    page.path === '/'
                                        ? location.pathname === '/'
                                        : location.pathname === `/${page.path}` || location.pathname.startsWith(`/${page.path}/`)
                                            ? 'active'
                                            : ''
                                }`}
                            >
                                {page.icon && <span className="nav-icon material-icons">{page.icon}</span>}
                                <span className="nav-title">{page.title}</span>
                            </Link>
                                {page.subpages?.length >= 1 && (
                                    <ul className="submenu">
                                        {page.subpages
                                            .filter((subpage) => user.role >= subpage.minRole)
                                            .filter((subpage) => subpage.path !== '')
                                            .map((subpage) => (
                                                <li key={`${page.path}/${subpage.path}`} className="submenu-item">
                                                    <Link
                                                        to={`${page.path}${subpage.path ? `/${subpage.path}` : ''}`}
                                                        className={`subpage-link ${
                                                            location.pathname === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
                                                                ? 'active'
                                                                : ''
                                                        }`}
                                                    >
                                                        {subpage.title}
                                                    </Link>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                    ))}
                </nav>
                <div className='user-nav'>
                    <span className='username'>
                        {user?.first_name || 'User'}
                    </span>
                    <i className="material-icons">keyboard_arrow_down</i>
                    <ul className='submenu'>
                        { hasManagerAccess &&
                            <li className='submenu-item'>
                                <Link to='#' onClick={() => switchView(true)}>Manager Portal</Link>
                            </li> }
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

export default StaffView;
