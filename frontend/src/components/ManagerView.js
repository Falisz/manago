//FRONTEND/ManagerView.js
import '../assets/styles/Manager.css';
import React, {useState, useEffect} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/manager-logo.svg';
import { ReactComponent as SiteLogoSmall } from '../assets/app-logo-s.svg';
import axios from "axios";
import MobileNav from './MobileNav';
import useAppStatus from "../contexts/AppStatusContext";

// TODO: Different logo per branch (?) e.g. if user is from Branch One they have diff logo than the user from Branch Two.

const MainNav = () => {
    const { user, appConfig } = useAppStatus();
    const location = useLocation();
    const [navCollapsed, setNavCollapsed] = useState(user.manager_nav_collapsed);

    useEffect(() => {
        const fetchNavCollapsed = async () => {
            try {
                const res = await axios.get('/access', { withCredentials: true });
                setNavCollapsed(res.data.user.manager_nav_collapsed || false);
            } catch (error) {
                console.error('Error fetching nav_collapsed:', error);
                setNavCollapsed(false);
            }
        };
        fetchNavCollapsed().then();
    }, []);

    const toggleNavCollapse = async () => {
        const toggledValue = !navCollapsed;
        setNavCollapsed(toggledValue);

        try {
            await axios.post(
                '/toggle-nav',
                { user: user, nav_collapsed: toggledValue },
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Error toggling nav:', error);
            setNavCollapsed(navCollapsed);
        }
    };

    return (
        <nav className={`app-nav ${navCollapsed ? 'app-nav-collapsed' : ''}`}>
            <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                <SiteLogo className={'app-logo '}/>
                <SiteLogoSmall className={'app-logo-small '}/>
            </Link>
            {appConfig.pages && appConfig.pages
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
                        <span className="app-nav-page-link-label">
                        {   (page.title.toLowerCase() === 'employees' && appConfig.modules?.some(m => m.title === 'Teams' && m.enabled))
                            ? 'Employees & Teams'
                            : page.title}
                        </span>
                    </Link>
                ))}
            <span
                className="nav-collapse-button material-symbols-outlined"
                onClick={toggleNavCollapse}
            >
                        {navCollapsed ? 'left_panel_open' : 'left_panel_close'}
                    </span>
        </nav>
    )
}

const SubNav = ({currentMainPage, location}) => {
    const { user, toggleView } = useAppStatus();

    return (
        <nav className="app-subnav">
            <ul className="subpage-links">
                {currentMainPage &&
                <li
                    key={`${currentMainPage?.path}`}
                    className={`subpage-link ${location.pathname === '/' || location.pathname === `/${currentMainPage?.path}` ? 'selected' : ''}`}>
                    <Link to={`${currentMainPage?.path}`}>
                        {currentMainPage?.title}
                    </Link>
                </li>
                }
                {currentMainPage?.subpages?.map((subpage) => (
                    <li
                        key={subpage.path}
                        className={`subpage-link ${location.pathname.startsWith(`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`) ? 'selected' : ''}`}
                    >
                        <Link to={`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`}>
                            {subpage.title}
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="user-nav">
                        <span className="username">
                            {user?.first_name || 'User'}
                        </span>
                <i className="material-icons">keyboard_arrow_down</i>
                <ul className="submenu">
                    <li className="submenu-item">
                        <Link to="#" onClick={() => toggleView(false)}>
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
    )
}

const ManagerView = () => {
    const { appConfig } = useAppStatus();
    const location = useLocation();

    const currentMainPage = appConfig.pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || appConfig.pages?.[0] || null;

    return (
        <>
            <MainNav/>
            <MobileNav
                logoText={`Manager ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                currentView={'manager'}
                currentPath={location.pathname}
            />
            <div className="app-content">
                <SubNav
                    currentMainPage={currentMainPage}
                    location={location}
                />
                <main className={currentMainPage?.path}>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default ManagerView;