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
import PostsIndex from './components/PostsIndex';
import PostsShow from './components/PostsShow';
import UsersIndex from './components/Users/Index';
import UserEdit from './components/Users/Edit';

const Dashboard = () => <InWorks title={'Dashboard'} />;
const Schedule = () => <InWorks title={'Schedule'} />;
const Posts = () => <InWorks title={'Forum'} />;
const Trainings = () => <InWorks title={'Trainings'} />;
const Dispositions = () => <InWorks title={'Dispositions Dispositions'} />;
const ManagerDashboard = () => <InWorks title={'ManagerDashboard'} />;
const ScheduleShow = () => <InWorks title={'Work schedule'} />;
const ScheduleEdit = () => <InWorks title={'Work schedule editor'} />;
const SchedulePast = () => <InWorks title={'Work schedule archive'} />;
const ScheduleNew = () => <InWorks title={'Work schedule creator'} />;
const PostsNew = () => <InWorks title={'Create new post'} />;
const PostsArchive = () => <InWorks title={'Posts archive'} />;

const componentMap = {
    Dashboard,
    Schedule,
    Posts,
    Trainings,
    Dispositions,
    ManagerDashboard,
    ScheduleShow,
    ScheduleEdit,
    SchedulePast,
    ScheduleNew,
    PostsIndex,
    PostsShow,
    PostsNew,
    PostsArchive,
    UsersIndex,
    UserEdit,
};

const theme = process.env['REACT_APP_THEME'] || 'dark';
const color = process.env['REACT_APP_COLOR'] || 'blue';

const AppContent = () => {
    const [pages, setPages] = useState([]);
    const { user, access, managerAccess, CheckAccess } = useUser();
    const [managerView, setManagerView] = useState(null);
    const { loading, setLoading } = useLoading();

    const FetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/pages', { withCredentials: true });
            if (Array.isArray(res.data)) {
                const mappedPages = res.data.map((page) => ({
                    ...page,
                    ...(page.component ? { component: componentMap[page.component] || NotFound } : {}),
                    subpages: page.subpages.map((subpage) => ({
                        ...subpage,
                        component: componentMap[subpage.component] || NotFound,
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
                    '/api/manager-view',
                    { user: user, manager_view: isManagerView },
                    { withCredentials: true }
                );
                if (res.data.success) {
                    setManagerView(isManagerView);
                }
            } else {
                await axios.post(
                    '/api/manager-view',
                    { user: user, manager_view: false },
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
        setLoading(true);
        import(`./assets/styles/palette-${theme}-${color}.css`).then();
        CheckAccess().then();
    }, [setLoading, CheckAccess]);

    useEffect(() => {
        FetchPages().then();
    }, [FetchPages]);

    useEffect(() => {
        setManagerView(user?.manager_view || false);
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
                    <Route index element={<Dashboard />} />
                    {pages.map((page) => (
                        <Route key={page.path} path={page.path}>
                            <Route
                                index
                                element={page.component ? React.createElement(page.component) : <NotFound />}
                            />
                            {page.subpages.map((subpage) => (
                                <Route
                                    key={`${page.path}/${subpage.path}`}
                                    path={subpage.path ? `${subpage.path}` : ''}
                                    index={!subpage.path}
                                    element={React.createElement(subpage.component)}
                                />
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
