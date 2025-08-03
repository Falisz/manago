//FRONTEND/App.js
// MAIN IMPORTS
import React, {useState, useEffect, useCallback} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import axios from 'axios';
import './assets/styles/App.css';
import { ConnectivityProvider } from './ConnectivityContext';
import { LoadingProvider, useLoading } from './LoadingContext';
import { UserProvider, useUser } from './UserContext';

// COMPONENTS
import Login from './components/Login';
import Logout from './components/Logout';
import NotFound from './components/NotFound';
import InWorks from './components/InWorks';
import NoAccess from './components/NoAccess';
import Loader from './components/Loader';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import ConnectivityPopup from './components/ConnectivityPopup';
import PostsIndex from './components/Posts/Index';
import UsersIndex from './components/Users/Index';
import UserEdit from './components/Users/Edit';
import RolesIndex from './components/Roles/Index';

const Dashboard = () => <InWorks title={'Dashboard'} icon={'dashboard'}/>;
const Schedule = () => <InWorks title={'Schedule'} icon={'schedule'}/>;
const Trainings = () => <InWorks title={'Trainings'} icon={'school'} />;
const Dispositions = () => <InWorks title={'Dispositions Dispositions'} icon={'punch_clock'} />;

const ManagerDashboard = () => <InWorks title={'Manager Dashboard'} icon={'dashboard'} />;
const TeamsIndex = () => <InWorks title={'Teams'} icon={'groups'} />;
const BranchIndex = () => <InWorks title={'Branches'} icon={'graph_3'} />;
const ProjectIndex = () => <InWorks title={'Projects'} icon={'fact_check'} />;
const ScheduleShow = () => <InWorks title={'Work schedule'} icon={'schedule'} />;
const SchedulePast = () => <InWorks title={'Work schedule archive'} icon={'archive'} />;
const PostsArchive = () => <InWorks title={'Posts archive'} icon={'archive'}/>;

const componentMap = {
    Dashboard,
    Schedule,
    Trainings,
    Dispositions,
    ManagerDashboard,
    RolesIndex,
    TeamsIndex,
    BranchIndex,
    ProjectIndex,
    ScheduleShow,
    SchedulePast,
    PostsIndex,
    PostsArchive,
    UsersIndex,
    UserEdit,
};

const theme = process.env['REACT_APP_THEME'] || 'dark';
const color = process.env['REACT_APP_COLOR'] || 'blue';

const renderRoutes = (pages, parentPath = '') => {
    return pages.map((page) => {
        const currentPath = page.path ? `${parentPath}/${page.path}`.replace(/^\/+/, '/') : parentPath;

        return (
            <Route key={currentPath || page.title} path={page.path}>
                <Route
                    index
                    element={page.component ? React.createElement(page.component) : <NotFound />}
                />
                {page.subpages && page.subpages.length > 0 && renderRoutes(page.subpages, currentPath)}
            </Route>
        );
    });
};

const AppContent = () => {
    const [pages, setPages] = useState([]);
    const { user, access, managerAccess, CheckAccess } = useUser();
    const [managerView, setManagerView] = useState(null);
    const { loading, setLoading } = useLoading();

    const FetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/pages', { withCredentials: true });
            if (Array.isArray(res.data)) {
                const mappedPages = res.data.map((page) => ({
                    ...page,
                    ...(page.component ? { component: componentMap[page.component] || NotFound } : {}),
                    subpages: page.subpages.map((subpage) => ({
                        ...subpage,
                        ...(subpage.component ? { component: componentMap[subpage.component] || NotFound } : {}),
                        subpages: subpage.subpages.map((subsubpage) => ({
                            ...subsubpage,
                            ...(subsubpage.component ? { component: componentMap[subsubpage.component] || NotFound } : {}),
                            subpages: [],
                        })),
                    })),
                }));
                setPages(mappedPages);
            } else {
                setPages([]);
            }
        } catch (err) {
            console.error('Error fetching pages:', err);
            setPages([]);
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    const ToggleManagerView = async (isManagerView) => {
        setLoading(true);
        try {
            if (isManagerView && managerAccess) {
                const res = await axios.post(
                    '/manager-view',
                    { manager_view: isManagerView },
                    { withCredentials: true }
                );
                if (res.data.success) {
                    setManagerView(isManagerView);
                }
            } else {
                await axios.post(
                    '/manager-view',
                    { manager_view: false },
                    { withCredentials: true }
                );
                setManagerView(false);
            }
            await FetchPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.getElementById('root').classList.add(theme);
        document.getElementById('root').classList.add(color);
        setLoading(true);
        CheckAccess().then();
    }, [setLoading, CheckAccess]);

    useEffect(() => {
        FetchPages().then();
    }, [FetchPages]);

    useEffect(() => {
        setManagerView(user?.manager_view_enabled || false);
    }, [user]);

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return (
            <>
                <Login />
                <ConnectivityPopup />
            </>
        );
    }

    if (managerView) {
        document.getElementById('root').classList.add('manager');
        document.getElementById('root').classList.remove('staff');
    } else {
        document.getElementById('root').classList.add('staff');
        document.getElementById('root').classList.remove('manager');
    }

    if (!access) {
        return (
            <>
                <Routes>
                    <Route path="*" element={<Navigate to="/" replace />} />
                    <Route path="/" element={<NoAccess user={user} />} />
                    <Route
                        path="logout"
                        element={
                            <Logout
                                onLogout={() => {
                                    setManagerView(false);
                                    setLoading(false);
                                }}
                            />
                        }
                    />
                </Routes>
                <ConnectivityPopup />
            </>
        );
    }

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        managerView ? (
                            <ManagerView pages={pages} switchView={ToggleManagerView}/>
                        ) : (
                            <StaffView pages={pages} switchView={ToggleManagerView}/>
                        )
                    }
                >
                    {pages.map((page) => (
                        <Route key={page.path} path={page.path}>
                            <Route
                                index
                                element={page.component ? React.createElement(page.component) : <NotFound />}
                            />
                            {page.subpages.map((subpage) => (
                                <Route
                                    key={`${page.path}/${subpage.path}` || subpage.title}
                                    path={subpage.path ? `${subpage.path}` : ''}
                                    index={!subpage.path}
                                    element={subpage.component ? React.createElement(subpage.component) : <NotFound />}
                                >
                                    {subpage.subpages.map((subsubpage) => (
                                        <Route
                                            key={`${page.path}/${subpage.path}/${subsubpage.path}` || subsubpage.title}
                                            path={subsubpage.path ? `${subsubpage.path}` : ''}
                                            index={!subsubpage.path}
                                            element={subsubpage.component ? React.createElement(subsubpage.component) : <NotFound />}
                                        />
                                    ))}
                                </Route>
                            ))}
                        </Route>
                    ))}
                    <Route
                        path="logout"
                        element={ <Logout onLogout={ () => { setManagerView(false); } }/> }
                    />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
            <ConnectivityPopup />
        </>
    );
};

const App = () => {
    return (
        <ConnectivityProvider>
            <LoadingProvider>
                <UserProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </UserProvider>
            </LoadingProvider>
        </ConnectivityProvider>
    );
};

export default App;
