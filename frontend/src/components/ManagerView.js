//FRONTEND/ManagerView.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/manager-logo.svg';
// import { ReactComponent as SiteLogoSmall } from '../assets/manager-logo-s.svg';
import axios from "axios";

const ManagerView = ({ user, pages, switchView, navCollapsed, setNavCollapsed }) => {
    const location = useLocation();

    const currentMainPage = pages.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages[0];

    const accessibleSubpages = currentMainPage.subpages.filter(
        (subpage) => user.role >= subpage.minRole
    );

    const toggleNavCollapse = async () => {
        setNavCollapsed((prev) => !prev);
        await axios.get('/api/toggle-nav', {withCredentials: true});
    };

    return (
        <div className="app manager">
            <nav className={`manager-nav ${navCollapsed ? 'manager-nav-collapsed' : ''}`}>
                <Link to="/" className={`manager-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogo className={'manager-logo '}/>
                </Link>
                {pages
                    .filter((page) => user.role >= page.minRole)
                    .filter((page) => page.path !== "/")
                    .map((page) => (
                        <Link
                            key={page.path}
                            to={page.path}
                            className={`manager-nav-page-link ${
                                page.path === '/'
                                    ? location.pathname === '/'
                                    : location.pathname === `/${page.path}` || location.pathname.startsWith(`/${page.path}/`)
                                        ? 'active'
                                        : ''
                            }`}
                        >
                            {page.icon && <span className="manager-nav-page-link-icon material-icons">{page.icon}</span>}
                            <span className="manager-nav-page-link-label">{page.title}</span>
                        </Link>
                    ))}
                <span
                    className="nav-collapse-button material-symbols-outlined"
                    onClick={toggleNavCollapse}>
                    {navCollapsed ? 'left_panel_open' : 'left_panel_close'}
                </span>
            </nav>
            <div className="manager-content">
                <nav className="manager-subnav">
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
                                <Link to="#" onClick={() => switchView(false)}>
                                    Staff Portal
                                </Link>
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

export default ManagerView;