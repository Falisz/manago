//FRONTEND/StaffView.js
import '../Staff.css';
import React, {useState} from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as SiteLogo } from '../assets/staff-logo.svg';
import { ReactComponent as SiteLogoMobile } from '../assets/app-logo-m.svg';

const StaffView = ({ user, pages, switchView, hasManagerAccess }) => {
    const location = useLocation();

    const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
    const toggleMobileNav = (val) => {
        setMobileNavExpanded(val);
    };

    return (
        <>
            <div className="app-nav">
                <Link to="/"  title={'Home'} className={`app-home`}>
                    <SiteLogo class={'app-logo'}/>
                </Link>
                <ul className="app-pages">
                    {pages
                        .filter((page) => user.role >= page.minRole)
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
                                            .filter((subpage) => user.role >= subpage.minRole)
                                            .filter((subpage) => subpage.path !== '')
                                            .map((subpage) => (
                                                <li key={`${page.path}/${subpage.path}`} className="submenu-item">
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
                        { hasManagerAccess &&
                            <li className='submenu-item'>
                                <Link to='#' onClick={() => switchView(true)}>Manager Portal</Link>
                            </li> }
                        <li className='submenu-item'>
                            <Link  to='/logout' className='logout'>Logout</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <nav className={`app-mobile-nav ${mobileNavExpanded ? 'expanded' : ''}`}>
                <Link to="/" className={`app-home-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <SiteLogoMobile className={'app-logo-mobile '}/>
                    <span>STAFF</span>
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
                                            .filter((subpage) => subpage.path !== '')
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
                            { hasManagerAccess &&
                                <li className="submenu-item">
                                    <Link to="#" onClick={() => switchView(true)}>
                                        Manager Portal
                                    </Link>
                                </li>
                            }
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
                <main>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default StaffView;
