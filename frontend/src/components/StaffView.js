//FRONTEND/StaffView.js
import '../assets/styles/Staff.css';
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/staff-logo.svg';
import MobileNav from './MobileNav';
import useAppState from '../contexts/AppStateContext';
import UserSubMenu from "./UserSubMenu";

const StaffView = () => {
    const { user, appState } = useAppState();
    const location = useLocation();

    const currentMainPage = appState.pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || appState.pages?.[0] || null;

    return (
        <>
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
                                {page.icon && <i className='page-icon material-icons'>{page.icon}</i>}
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
                    <span className='username'>
                        {user?.first_name || 'User'}
                    </span>
                    <i className='material-icons'>keyboard_arrow_down</i>
                    <UserSubMenu />
                </div>
            </nav>
            <MobileNav
                logoText={`Staff ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                currentView={'staff'}
                currentPath={location.pathname}
            />
            <div className='app-content'>
                <main className={currentMainPage?.path}>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default StaffView;
