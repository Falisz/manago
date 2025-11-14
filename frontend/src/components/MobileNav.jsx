// FRONTEND/Components/MobileNav.jsx
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import useApp from '../contexts/AppContext';
import Icon from './Icon';
import '../styles/MobileNav.css';
import {ReactComponent as SiteLogoMobile} from '../assets/app-logo-m.svg';

const MobileNav = ({ logoText, currentView, currentPath }) => {
    const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
    const { user, appState, toggleView } = useApp();

    return (
        <nav className={`app-mobile-nav ${mobileNavExpanded ? 'expanded' : ''}`}>
            <Link to='/' className={`app-home-link ${currentPath === '/' ? 'active' : ''}`}>
                <SiteLogoMobile className={'app-logo-mobile'} />
            </Link>
            <div className={'app-mobile-nav-title'}>{logoText}</div>
            <Icon
                className={'app-mobile-nav-view-button'}
                onClick={() => setMobileNavExpanded(true)}
                i={'menu'}
            />
            <div className={`app-mobile-nav-backdrop ${mobileNavExpanded ? 'expanded' : ''}`}
                 inert={mobileNavExpanded ? null : true}
                 onClick={() => setMobileNavExpanded(false)}></div>
            <ul className={`app-mobile-nav-links ${mobileNavExpanded ? 'expanded' : ''}`} inert={mobileNavExpanded ? null : true}>
                <li className={'app-mobile-nav-link-item nav-collapse-button'} onClick={() => setMobileNavExpanded(false)}>
                    <Icon
                        i={'left_panel_open'}
                        s={true}
                    />
                </li>
                {appState.pages && appState.pages
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
                                {page.icon && <Icon className='app-nav-page-link-icon' i={page.icon} />}
                                <span className='app-nav-page-link-label'>{page.title}</span>
                            </Link>
                            {page.subpages?.length >= 1 && (
                                <ul className='submenu'>
                                    {page.subpages
                                        .filter((subpage) => subpage.path !== '')
                                        .map((subpage) => (!subpage.hidden &&
                                            <li key={`${page.path}/${subpage.path}`} className='submenu-item'>
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
                    <Link className='app-nav-page-link' to='#'>
                        <Icon className='app-nav-page-link-icon' icon={'account_circle'} />
                        <span className='app-nav-page-link-label'>{user?.first_name || 'User'}</span>
                    </Link>
                    <ul className='submenu'>
                        {user.manager_view_access && (
                            <li className='submenu-item'>
                                <Link to='#' onClick={() => { toggleView(currentView === 'staff'); setMobileNavExpanded(false); }}>
                                    {currentView === 'staff' ? 'Go to Manager Portal' : 'Go to Staff Portal'}
                                </Link>
                            </li>
                        )}
                        <li className='submenu-item'>
                            <Link to='/logout' className='logout' onClick={() => setMobileNavExpanded(false)}>
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