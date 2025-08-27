//FRONTEND/StaffView.js
import '../assets/styles/Staff.css';
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/staff-logo.svg';
import MobileNav from './MobileNav';
import {useAuth} from "../contexts/AuthContext";

const StaffView = ({ pages, switchView }) => {
    const { user, managerAccess } = useAuth();
    const location = useLocation();

    const currentMainPage = pages?.find((page) =>
        location.pathname.startsWith(`/${page.path}`)
    ) || pages?.[0] || null;

    return (
        <>
            <div className="app-nav">
                <Link to="/"  title={'Home'} className={`app-home`}>
                    <SiteLogo className={'app-logo'}/>
                </Link>
                <ul className="app-pages">
                    {pages && pages
                        .filter((page) => page.path !== "/")
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
                                {page.icon && <i className="page-icon material-icons">{page.icon}</i>}
                                <span className="page-title">{page.title}</span>
                            </Link>
                                {page.subpages?.length >= 1 && (
                                    <ul className="submenu">
                                        {page.subpages
                                            .filter((subpage) => subpage.path !== '')
                                            .map((subpage) => (
                                                !subpage.hidden && <li key={`${page.path}/${subpage.path}`} className="submenu-item">
                                                    <Link
                                                        to={`${page.path}${subpage.path ? `/${subpage.path}` : ''}`}
                                                        className={`subpage-link ${
                                                            location.pathname === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
                                                                ? 'active'
                                                                : ''
                                                        }`}
                                                    >
                                                        {subpage.title}
                                                    </Link>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </li>
                    ))}
                </ul>
                <div className='app-user'>
                    <span className='username'>
                        {user?.first_name || 'User'}
                    </span>
                    <i className="material-icons">keyboard_arrow_down</i>
                    <ul className='submenu'>
                        { managerAccess &&
                            <li className='submenu-item'>
                                <Link to='#' onClick={() => switchView(true)}>Manager Portal</Link>
                            </li> }
                        <li className='submenu-item'>
                            <Link  to='/logout' className='logout'>Logout</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <MobileNav
                logoText={`Staff ${currentMainPage?.title && currentMainPage.title !== 'Home' ? `| ${currentMainPage.title}` : ``}`}
                pages={pages}
                user={user}
                hasManagerAccess={managerAccess}
                currentView={'staff'}
                switchView={switchView}
                currentPath={location.pathname}
            />
            <div className="app-content">
                <main className={currentMainPage?.path}>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default StaffView;
