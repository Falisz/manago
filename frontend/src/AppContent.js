import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Logout from './components/Logout';
import { InWorks, NotFound, NoAccess} from './components/Common';
import Loader from './components/Loader';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';
import { useLoading } from './LoadingContext';
import { useUser } from './UserContext';
import ConnectivityPopup from './components/ConnectivityPopup';
import PostsIndex from './components/PostsIndex';
import PostsShow from './components/PostsShow';
import UsersIndex from './components/UsersIndex';
import './App.css';

const theme = process.env['REACT_APP_THEME'] || 'dark';
const color = process.env['REACT_APP_COLOR'] || 'blue';

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
const EmployeesShow = () => <InWorks title={'Users list'} />;
const EmployeesNew = () => <InWorks title={'Add new user'} />;

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
    EmployeesShow,
    EmployeesNew,
    UsersIndex,
};

export const AppContent = () => {
    const [pages, setPages] = useState([]);
    const { user, setUser, access, managerAccess, CheckAccess } = useUser();
    const [managerView, setManagerView] = useState(null);
    const { loading, setLoading } = useLoading();

    const FetchPages = async () => {
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
    };

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

    const SwitchToManagerView = () => {
        useEffect(() => {
            ToggleManagerView(true).then();
        }, []);
        return <Navigate to="/" replace />;
    };

    const SwitchToStaffView = () => {
        useEffect(() => {
            ToggleManagerView(false).then();
        }, []);
        return <Navigate to="/" replace />;
    };

    useEffect(() => {
        import(`./assets/palette-${theme}-${color}.css`).then();
        CheckAccess().then();
    }, [CheckAccess]);

    useEffect(() => {
        if (user) {
            setManagerView(user.manager_view || false);
            FetchPages().then();
        }
    }, [user]);

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return (
            <div className="login">
                <Login />
                <ConnectivityPopup />
            </div>
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
            <Router>
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
            </Router>
        );
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        managerView ? (
                            <ManagerView
                                user={user}
                                pages={pages}
                                switchView={ToggleManagerView}
                            />
                        ) : (
                            <StaffView
                                user={user}
                                pages={pages}
                                switchView={ToggleManagerView}
                                hasManagerAccess={managerAccess}
                            />
                        )
                    }
                >
                    <Route index element={<Dashboard />} />
                    {pages.map((page) => (
                        <Route key={page.path} path={page.path}>
                            <Route
                                index
                                element={page.component ? <page.component /> : <NotFound />}
                            />
                            {page.subpages.map((subpage) => (
                                <Route
                                    key={`${page.path}/${subpage.path}`}
                                    path={subpage.path ? `${subpage.path}` : ''}
                                    index={!subpage.path}
                                    element={<subpage.component />}
                                />
                            ))}
                            {page.path === 'posts' && (
                                <Route path=":postId" element={<PostsIndex />} />
                            )}
                        </Route>
                    ))}
                    {managerView ? (
                        <Route path="staff-view" element={<SwitchToStaffView />} />
                    ) : (
                        <Route path="manager-view" element={<SwitchToManagerView />} />
                    )}
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
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
            <ConnectivityPopup />
        </Router>
    );
};

export default AppContent;