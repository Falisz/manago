//FRONTEND/Staff/Portal.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Portal = ({ user, pages }) => {
    const location = useLocation();

    return (
        <div className="app">
            <div className="app-header">
                <Link to="/" className='site-logo'>Staff Portal</Link>
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
