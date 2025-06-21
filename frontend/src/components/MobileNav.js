//FRONTEND/MobileNav.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as SiteLogoMobile } from '../assets/app-logo-m.svg';

const MobileNav = ({ logoText, pages, user, hasManagerAccess, currentView, switchView, currentPath }) => {
    const [mobileNavExpanded, setMobileNavExpanded] = useState(false);

    const toggleMobileNav = (val) => {
        setMobileNavExpanded(val);
    };

    return (
        <nav className={`app-mobile-nav ${mobileNavExpanded ? 'expanded' : ''}`}>
            <Link to="/" className={`app-home-link ${currentPath === '/' ? 'active' : ''}`}>
                <SiteLogoMobile className={'app-logo-mobile'} />
            </Link>
            <div className={'app-mobile-nav-title'}>{logoText}</div>
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
                        <li key={`${page.path}`} className={'app-mobile-nav-link-item'}>
                            <Link
                                key={page.path}
                                to={page.path}
                                className={`app-nav-page-link ${
                                    page.path === '/'
                                        ? currentPath === '/'
                                        : currentPath === `/${page.path}`
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
                                                        currentPath === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
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
                        {hasManagerAccess && (
                            <li className="submenu-item">
                                <Link to="#" onClick={() => { switchView(currentView === 'staff'); toggleMobileNav(false); }}>
                                    {currentView === 'staff' ? 'Go to Manager Portal' : 'Go to Staff Portal'}
                                </Link>
                            </li>
                        )}
                        <li className="submenu-item">
                            <Link to="/logout" className="logout" onClick={() => toggleMobileNav(false)}>
                                Logout
                            </Link>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
    );
};

export default MobileNav;