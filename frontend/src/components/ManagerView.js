//FRONTEND/ManagerView.js
import '../assets/styles/Manager.css';
import React, {useState} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/manager-logo.svg';
import { ReactComponent as SiteLogoSmall } from '../assets/app-logo-s.svg';
import axios from 'axios';
import MobileNav from './MobileNav';
import useAppState from '../contexts/AppStateContext';
import UserSubMenu from "./UserSubMenu";
import Icon from "./Icon";

const MainNav = () => {
    const { user, appState } = useAppState();
    const location = useLocation();
    const [navCollapsed, setNavCollapsed] = useState(user.manager_nav_collapsed);

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
            <Link to='/' className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                <SiteLogo className={'app-logo '}/>
                <SiteLogoSmall className={'app-logo-small '}/>
            </Link>
            {appState.pages && appState.pages
                .filter((page) => page.path !== '/')
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
                        {page.icon && <Icon className='app-nav-page-link-icon' i={page.icon} clickable={true}/>}
                        <span className='app-nav-page-link-label'>
                        {   (page.title.toLowerCase() === 'employees' && appState.modules?.some(m => m.title === 'Teams' && m.enabled))
                            ? 'Employees & Teams'
                            : page.title}
                        </span>
                    </Link>
                ))}
            <Icon
                className='nav-collapse-button'
                onClick={toggleNavCollapse}
                i={navCollapsed ? 'left_panel_open' : 'left_panel_close'}
                s={true}
            />
        </nav>
    )
}

const SubNav = ({currentMainPage, location}) => {
    const { user } = useAppState();

    return (
        <nav className={`app-sub-nav ${currentMainPage?.subpages?.length > 0 ? '' : 'no-subpages'}`}>
            {currentMainPage?.subpages?.length > 0 &&
            <Link
                key={`${currentMainPage?.path}`}
                className={`subpage-link ${location.pathname === '/' || location.pathname === `/${currentMainPage?.path}` ? 'selected' : ''}`}
                to={`${currentMainPage?.path}`}
            >
                {currentMainPage?.title}
            </Link>
            }
            {currentMainPage?.subpages?.map((subpage) => (
                <Link
                    key={subpage.path}
                    className={`subpage-link ${location.pathname.startsWith(`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`) ? 'selected' : ''}`}
                    to={`/${currentMainPage.path}${subpage.path ? `/${subpage.path}` : ''}`}
                >
                    {subpage.title}
                </Link>
            ))}
            <div
                key={user?.first_name || 'user'}
                className='subpage-link user-link'
            >
                <Link className={'username'} to='#'>{user?.first_name || 'User'}</Link>
                <Icon i={'keyboard_arrow_down'} />
                <UserSubMenu />
            </div>
        </nav>
    )
}

const ManagerView = () => {
    const { appState } = useAppState();
    const location = useLocation();

    const currentMainPage = appState.pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || (location.pathname === "/" ? appState.pages?.[0] : null);

    return (
        <>
            <MainNav/>
            <MobileNav
                logoText={`Manager ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                currentView={'manager'}
                currentPath={location.pathname}
            />
            <div className='app-content'>
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