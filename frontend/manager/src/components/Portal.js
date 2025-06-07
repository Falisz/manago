//FRONTEND/Manager/Portal.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Portal = ({ user, pages }) => {
    const location = useLocation();
    const currentMainPage = pages.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages[0];


    const accessibleSubpages = currentMainPage.subpages.filter(
        (subpage) => user.role >= subpage.minRole
    );

    return (
        <div className="app">
            <nav className="app-nav">
                <Link to="/" className="site-logo">Manager Portal</Link>
                {pages
                    .filter((page) => user.role >= page.minRole)
                    .filter((page) => page.path !== "/")
                    .map((page) => (
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
                    ))}
            </nav>
            <div className="app-content">
                <nav className="app-subnav">
                    {accessibleSubpages.length > 1 && (
                        <ul className="subpage-links">
                            {accessibleSubpages.map((subpage) => (
                                <li
                                    key={subpage.path}
                                    className={`subpage-link ${location.pathname === `/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}` ? 'selected' : ''}`}
                                >
                                    <Link to={`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`}>
                                        {subpage.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="user-nav">
                        <span className="username">
                            {user?.username || 'User'}
                        </span>
                        <i className="material-icons">keyboard_arrow_down</i>
                        <ul className="submenu">
                            <li className="submenu-item">
                                <a className="goToStaff" href="http://localhost:3000">
                                    Go to Staff Portal
                                </a>
                            </li>
                            <li className="submenu-item">
                                <Link to="/logout" className="logout">
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Portal;