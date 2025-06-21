//FRONTEND/ManagerView.js
import '../Manager.css';
import React, {useState} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/manager-logo.svg';
import { ReactComponent as SiteLogoSmall } from '../assets/app-logo-s.svg';
import { ReactComponent as SiteLogoMobile } from '../assets/app-logo-m.svg';
import axios from "axios";

const ManagerView = ({ user, pages, switchView, navCollapsed, setNavCollapsed }) => {
    const location = useLocation();
    const [mobileNavExpanded, setMobileNavExpanded] = useState(false);

    const currentMainPage = pages.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages[0];

    const accessibleSubpages = currentMainPage?.subpages?.filter(
        (subpage) => user.role >= subpage.minRole
    ) || [];

    const toggleNavCollapse = async () => {
        const toggledValue = !navCollapsed;

        setNavCollapsed(toggledValue);

        try {
            await axios.post('/api/toggle-nav',
                { user: user, nav_collapsed: toggledValue }, // Use toggledValue here
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Error toggling nav:', error);
            setNavCollapsed(navCollapsed);
        }
    };

    const toggleMobileNav = (val) => {
        setMobileNavExpanded(val);
    };

    return (
        <>
            <nav className={`app-nav ${navCollapsed ? 'app-nav-collapsed' : ''}`}>
                <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogo className={'app-logo '}/>
                    <SiteLogoSmall className={'app-logo-small '}/>
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
            <nav className={`app-mobile-nav ${mobileNavExpanded ? 'expanded' : ''}`}>
                <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogoMobile className={'app-logo-mobile '}/>
                    <span>MANAGER</span>
                </Link>
                <span className={'app-mobile-nav-view-button material-icons'} onClick={() => toggleMobileNav(true)}>
                    menu
                </span>
                <div className={`app-mobile-nav-backdrop ${mobileNavExpanded ? 'expanded' : ''}`}
                     onClick={() => toggleMobileNav(false)}></div>
                <ul className={`app-mobile-nav-links ${mobileNavExpanded ? 'expanded' : ''}`}>
                    <li className={'app-mobile-nav-link-item nav-collapse-button'} onClick={() => toggleMobileNav(false)}>
                        <span className={'material-symbols-outlined'}>
                            left_panel_open
                        </span>
                    </li>
                    {pages
                        .filter((page) => user.role >= page.minRole)
                        .map((page) => (
                            <li key={`${page.path}`} className={'app-mobile-nav-link-item'}><Link
                                key={page.path}
                                to={page.path}
                                className={`app-nav-page-link ${
                                    page.path === '/'
                                        ? location.pathname === '/'
                                        : location.pathname === `/${page.path}`
                                            ? 'active'
                                            : ''
                                }`}
                                onClick={() => toggleMobileNav(false)}
                            >
                                {page.icon && <span className="app-nav-page-link-icon material-icons">{page.icon}</span>}
                                <span className="app-nav-page-link-label">{page.title}</span>
                            </Link>
                            {page.subpages?.length >= 1 && (
                                <ul className="submenu">
                                    {page.subpages
                                        .filter((subpage) => user.role >= subpage.minRole)
                                        .map((subpage) => (
                                            <li key={`${page.path}/${subpage.path}`} className="submenu-item">
                                                <Link
                                                    to={`${page.path}${subpage.path ? `/${subpage.path}` : ''}`}
                                                    className={`${
                                                        location.pathname === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                    onClick={() => toggleMobileNav(false)}
                                                >
                                                    {subpage.title}
                                                </Link>
                                            </li>
                                        ))}
                                </ul>
                            )}
                            </li>
                        ))}
                        <li className={'app-mobile-nav-link-item user-link'}>
                            <Link className="app-nav-page-link" to="#">
                                <span className="app-nav-page-link-icon material-icons">account_circle</span>
                                <span className="app-nav-page-link-label">{user?.first_name || 'User'}</span>
                            </Link>

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
                        </li>
                </ul>
            </nav>
            <div className="app-content">
                <nav className="app-subnav">
                {accessibleSubpages.length > 1 && (
                        <ul className="subpage-links">
                            <li
                                key={`${currentMainPage.path}`}
                                className={`subpage-link ${location.pathname === `/${currentMainPage.path}` ? 'selected' : ''}`}>
                                <Link to={`${currentMainPage.path}`}>
                                    {currentMainPage.title}
                                </Link>
                            </li>
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
                            {user?.first_name || 'User'}
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
        </>
    );
};

export default ManagerView;