// FRONTEND/ManagerView.jsx
import React, {useState} from 'react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import useApp from '../contexts/AppContext';
import Icon from './Icon';
import MobileNav from './MobileNav';
import UserSubMenu from './UserSubMenu';
import '../styles/ManagerView.css';
import {ReactComponent as SiteLogo} from '../assets/manager-logo.svg';
import {ReactComponent as SiteLogoSmall} from '../assets/app-logo-s.svg';

const MainNav = () => {
    const { user, appState } = useApp();
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
    const { user } = useApp();

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
                !subpage.hidden && <Link
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
    const { pages } = useApp();
    const location = useLocation();

    const currentMainPage = pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || (location.pathname === '/' ? pages?.[0] : null);

    const currentSubPage = currentMainPage?.subpages?.find((subpage) =>
        location.pathname.startsWith(`/${currentMainPage.path}/${subpage.path}`)        
    );

    const pageTitle = currentSubPage?.title || currentMainPage?.title || null;

    return (
        <>
            <Helmet>
                <title>{pageTitle ? [pageTitle, 'MANAGO'].join(' | ') : 'MANAGO'}</title>
            </Helmet>
            <MainNav/>
            <MobileNav
                logoText={`Manager ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                currentView={'manager'}
                currentPath={location.pathname}
            />
            <SubNav
                currentMainPage={currentMainPage}
                location={location}
            />
            <main className={`app-content ${currentMainPage?.path}`}>
                <Outlet />
            </main>
        </>
    );
};

export default ManagerView;