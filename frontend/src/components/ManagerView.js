//FRONTEND/ManagerView.js
import '../assets/styles/Manager.css';
import React, {useState, useEffect} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/manager-logo.svg';
import { ReactComponent as SiteLogoSmall } from '../assets/app-logo-s.svg';
import axios from "axios";
import MobileNav from './MobileNav';
import {useUser} from "../UserContext";

const ManagerView = ({pages, switchView }) => {
    const { user } = useUser();
    const location = useLocation();
    const [navCollapsed, setNavCollapsed] = useState(false);

    useEffect(() => {
        const fetchNavCollapsed = async () => {
            try {
                const res = await axios.get('/api/access', { withCredentials: true });
                setNavCollapsed(res.data.user.manager_nav_collapsed || false);
            } catch (error) {
                console.error('Error fetching nav_collapsed:', error);
                setNavCollapsed(false);
            }
        };
        fetchNavCollapsed().then();
    }, []);

    const currentMainPage = pages.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages[0];

    const toggleNavCollapse = async () => {
        const toggledValue = !navCollapsed;
        setNavCollapsed(toggledValue);

        try {
            await axios.post(
                '/api/toggle-nav',
                { user: user, nav_collapsed: toggledValue },
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Error toggling nav:', error);
            setNavCollapsed(navCollapsed);
        }
    };

    return (
        <>
            <nav className={`app-nav ${navCollapsed ? 'app-nav-collapsed' : ''}`}>
                <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogo className={'app-logo '}/>
                    <SiteLogoSmall className={'app-logo-small '}/>
                </Link>
                {pages
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
                    onClick={toggleNavCollapse}
                >
                    {navCollapsed ? 'left_panel_open' : 'left_panel_close'}
                </span>
            </nav>

            <MobileNav
                logoText={`Manager ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                pages={pages}
                user={user}
                hasManagerAccess={true}
                currentView={'manager'}
                switchView={switchView}
                currentPath={location.pathname}
            />

            <div className="app-content">
                <nav className="app-subnav">
                    <ul className="subpage-links">
                        <li
                            key={`${currentMainPage?.path}`}
                            className={`subpage-link ${location.pathname === '/' || location.pathname === `/${currentMainPage?.path}` ? 'selected' : ''}`}>
                            <Link to={`${currentMainPage?.path}`}>
                                {currentMainPage?.title}
                            </Link>
                        </li>
                        {currentMainPage?.subpages?.length >= 1 && currentMainPage?.subpages?.map((subpage) => (
                            (!subpage.path.startsWith(':') &&
                            <li
                                key={subpage.path}
                                className={`subpage-link ${location.pathname === `/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}` ? 'selected' : ''}`}
                            >
                                <Link to={`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`}>
                                    {subpage.title}
                                </Link>
                            </li>)
                        ))}
                    </ul>
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
                <main className={currentMainPage?.path}>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default ManagerView;