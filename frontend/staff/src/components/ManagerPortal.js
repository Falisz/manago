//FRONTEND/Manager/Portal.js
import React, {useState} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/site-logo.svg';
import { ReactComponent as SiteLogoSmall } from '../assets/site-logo-small.svg';
import axios from "axios";

const ManagerPortal = ({ user, pages }) => {
    const location = useLocation();
    const [navCollapsed, setNavCollapsed] = useState(user.manager_nav_collapsed);

    const currentMainPage = pages.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages[0];

    const accessibleSubpages = currentMainPage.subpages.filter(
        (subpage) => user.role >= subpage.minRole
    );

    const toggleNavCollapse = async () => {
        setNavCollapsed((prev) => !prev);
        await axios.get('/api/manager/toggle-nav', {withCredentials: true});
    };

    return (
        <div className="app">
            <nav className={`app-nav ${navCollapsed ? 'app-nav-collapsed' : ''}`}>
                <Link to="/" className="app-home-link">
                    <SiteLogo className={'app-logo'}/>
                    <SiteLogoSmall className={'app-logo-small'}/>
                </Link>
                {pages
                    .filter((page) => user.role >= page.minRole)
                    .filter((page) => page.path !== "/")
                    .map((page) => (
                        <Link
                            key={page.path}
                            to={page.path}
                            className={`app-nav-page-link ${
                                page.path === '/'
                                    ? location.pathname === '/'
                                    : location.pathname === `/${page.path}` || location.pathname.startsWith(`/${page.path}/`)
                                        ? 'active'
                                        : ''
                            }`}
                        >
                            {page.icon && <span className="app-nav-page-link-icon material-icons">{page.icon}</span>}
                            <span className="app-nav-page-link-label">{page.title}</span>
                        </Link>
                    ))}
                <span
                    className="nav-collapse-button material-symbols-outlined"
                    onClick={toggleNavCollapse}>
                    {navCollapsed ? 'left_panel_open' : 'left_panel_close'}
                </span>
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
                                <Link to="/staff-portal" className="goToStaff">
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

export default ManagerPortal;