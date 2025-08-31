//FRONTEND/MobileNav.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as SiteLogoMobile } from '../assets/app-logo-m.svg';
import {useAuth} from "../contexts/AuthContext";
import {useAppCore} from "../contexts/AppCoreContext";

const MobileNav = ({ logoText, currentView, currentPath }) => {
    const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
    const { user, managerAccess } = useAuth();
    const { pages, toggleView } = useAppCore();

    return (
        <nav className={`app-mobile-nav ${mobileNavExpanded ? 'expanded' : ''}`}>
            <Link to="/" className={`app-home-link ${currentPath === '/' ? 'active' : ''}`}>
                <SiteLogoMobile className={'app-logo-mobile'} />
            </Link>
            <div className={'app-mobile-nav-title'}>{logoText}</div>
            <span className={'app-mobile-nav-view-button material-icons'} onClick={() => setMobileNavExpanded(true)}>
                menu
            </span>
            <div className={`app-mobile-nav-backdrop ${mobileNavExpanded ? 'expanded' : ''}`}
                 onClick={() => setMobileNavExpanded(false)}></div>
            <ul className={`app-mobile-nav-links ${mobileNavExpanded ? 'expanded' : ''}`}>
                <li className={'app-mobile-nav-link-item nav-collapse-button'} onClick={() => setMobileNavExpanded(false)}>
                    <span className={'material-symbols-outlined'}>
                        left_panel_open
                    </span>
                </li>
                {pages && pages
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
                                onClick={() => setMobileNavExpanded(false)}
                            >
                                {page.icon && <span className="app-nav-page-link-icon material-icons">{page.icon}</span>}
                                <span className="app-nav-page-link-label">{page.title}</span>
                            </Link>
                            {page.subpages?.length >= 1 && (
                                <ul className="submenu">
                                    {page.subpages
                                        .filter((subpage) => subpage.path !== '')
                                        .map((subpage) => (!subpage.hidden &&
                                            <li key={`${page.path}/${subpage.path}`} className="submenu-item">
                                                <Link
                                                    to={`${page.path}${subpage.path ? `/${subpage.path}` : ''}`}
                                                    className={`${
                                                        currentPath === `/${page.path}${subpage.path ? `/${subpage.path}` : ''}`
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                    onClick={() => setMobileNavExpanded(false)}
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
                        {managerAccess && (
                            <li className="submenu-item">
                                <Link to="#" onClick={() => { toggleView(currentView === 'staff'); setMobileNavExpanded(false); }}>
                                    {currentView === 'staff' ? 'Go to Manager Portal' : 'Go to Staff Portal'}
                                </Link>
                            </li>
                        )}
                        <li className="submenu-item">
                            <Link to="/logout" className="logout" onClick={() => setMobileNavExpanded(false)}>
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