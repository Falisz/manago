// FRONTEND/StaffView.jsx
import React from 'react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import useApp from '../contexts/AppContext';
import Icon from './Icon';
import MobileNav from './MobileNav';
import UserSubMenu from './UserSubMenu';
import '../styles/StaffView.css';
import {ReactComponent as SiteLogo} from '../assets/staff-logo.svg';

const StaffView = () => {
    const { user, appState } = useApp();
    const location = useLocation();

    const currentMainPage = appState.pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || appState.pages?.[0] || null;

    const currentSubPage = currentMainPage?.subpages?.find((subpage) =>
        location.pathname.startsWith(`/${currentMainPage.path}/${subpage.path}`)        
    );

    const pageTitle = currentSubPage?.title || currentMainPage?.title || null;

    return (
        <>
            <Helmet>
                <title>{pageTitle ? ['MANAGO', pageTitle].join(' | ') : 'MANAGO'}</title>
            </Helmet>
            <nav className='app-nav seethrough'>
                <Link to='/'  title={'Home'} className={`app-home`}>
                    <SiteLogo className={'app-logo'}/>
                </Link>
                <ul className='app-pages'>
                    {appState.pages && appState.pages
                        .filter((page) => page.path !== '/')
                        .map((page) => (
                            <li key={page.path} className={'page-link-item'}>
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
                                {page.icon && <Icon className={'page-icon'} i={page.icon} clickable={true}/>}
                                <span className='page-title'>{page.title}</span>
                            </Link>
                                {page.subpages?.length >= 1 && (
                                    <nav className='app-sub-menu'>
                                        {page.subpages
                                            .filter((subpage) => subpage.path !== '')
                                            .map((subpage) => (
                                                !subpage.hidden &&
                                                    <Link
                                                        key={`${page.path}/${subpage.path}`}
                                                        to={`${page.path}${subpage.path ? `/${subpage.path}` : ''}`}
                                                        className={`sub-menu-link ${
                                                            location.pathname === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
                                                                ? 'active'
                                                                : ''
                                                        }`}
                                                    >
                                                        {subpage.title}
                                                    </Link>
                                            ))}
                                    </nav>
                                )}
                            </li>
                    ))}
                </ul>
                <div className='app-user'>
                    <Link className={'user-link'} to='#'>
                        {user?.first_name || 'User'}
                        <Icon i={'keyboard_arrow_down'} />
                    </Link>
                    <UserSubMenu />
                </div>
            </nav>
            <MobileNav
                logoText={`Staff ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                currentView={'staff'}
                currentPath={location.pathname}
            />
            <main className={`app-content ${currentMainPage?.path}`}>
                <Outlet />
            </main>
        </>
    );
};

export default StaffView;
