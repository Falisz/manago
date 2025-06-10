//FRONTEND/Staff/App.js
import './App.css';
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import StaffView from './components/StaffView';
import ManagerView from './components/ManagerView';

const Dashboard = () => <InWorks title={'Dashboard'}/>;
const Schedule = () => <InWorks title={'Schedule'}/>;
const Posts = () => <InWorks title={'Forum'}/>;
const Trainings = () => <InWorks title={'Trainings'}/>;
const Dispositions = () => <InWorks title={'Dispositions Dispositions'}/>;
const ManagerDashboard = () => <InWorks title={'ManagerDashboard'}/>;
const ScheduleShow = () => <InWorks title={'Work schedule'}/>;
const ScheduleEdit = () => <InWorks title={'Work schedule editor'}/>;
const SchedulePast = () => <InWorks title={'Work schedule archive'}/>;
const ScheduleNew = () => <InWorks title={'Work schedule creator'}/>;
const PostsShow = () => <InWorks title={'Forum'}/>;
const PostsNew = () => <InWorks title={'Create new post'}/>;
const PostsArchive = () => <InWorks title={'Posts archive'}/>;
const EmployeesShow = () => <InWorks title={'Users list'}/>;
const EmployeesNew = () => <InWorks title={'Add new user'}/>;

const InWorks = ({ title }) => (
    <div className="app-in-works">
        <span className="main-icon material-symbols-outlined">manufacturing</span>
        <h3>{title}</h3>
        <p>
            This page is under construction. It will be available soon.
        </p>
        <Link to="/">Return to Dashboard</Link>
    </div>
);

const NotFound = () => (
    <div className="app-not-found">
        <span className="main-icon material-symbols-outlined">error</span>
        <h3>404 - Page Not Found</h3>
        <p>
            The page you are trying to access does not exist or you lack the necessary permissions.
        </p>
        <Link to="/">Return to Dashboard</Link>
    </div>
)

// const NoAccess = ({ user }) => (
//     <div className="app-no-access">
//         <span className="main-icon material-symbols-outlined">error</span>
//         <p>Hi {user?.username || 'User'}! Looks like you don't have sufficient permissions to visit this portal.</p>
//         <p>You can <Link to={'/logout'}>logout</Link> and switch to another account.</p>
//     </div>
// );

const Loading = () => (
    <div className='app-loading'>Loading...</div>
);

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
    PostsShow,
    PostsNew,
    PostsArchive,
    EmployeesShow,
    EmployeesNew,
};

const App = () => {
    const [loading, setLoading] = useState(true);
    const [managerView, setManagerView] = useState(null);
    const isCheckingRef = useRef(false);
    const [user, setUser] = useState(null);
    const [pages, setPages] = useState([]);
    const [hasManagerAccess, setHasManagerAccess] = useState(false);
    const [managerNavCollapsed, setManagerNavCollapsed] = useState(null);

    const handleLogin = async (user) => {
        setLoading(true);
        setUser(user);
        setManagerView(user.manager_view);
        setManagerNavCollapsed(user.manager_nav_collapsed);
        await fetchPages();
        setLoading(false);
    };

    const checkAccess = useCallback(async () => {
        if (isCheckingRef.current)
            return;

        isCheckingRef.current = true;
        try {
            const res = await axios.get('/api/access', { withCredentials: true });

            if (res.data.access) {
                setUser(res.data.user);
                setManagerView(res.data.user.manager_view);
                setManagerNavCollapsed(res.data.user.manager_nav_collapsed);
                setHasManagerAccess(res.data.manager_access);
                await fetchPages();
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
            console.error(err);
        } finally {
            isCheckingRef.current = false;
            setLoading(false);
        }
    }, []);

    const fetchPages = async () => {
        try {
            const res = await axios.get('/api/pages', {withCredentials: true});

            if (!Array.isArray(res.data)) {
                setPages([]);
                return;
            }

            const mappedPages = res.data.map((page) => ({
                ...page,
                ...(page.component ? {component: componentMap[page.component] || NotFound } : {}),
                subpages: page.subpages.map((subpage) => ({
                    ...subpage,
                    component: componentMap[subpage.component] || NotFound,
                })),
            }));

            setPages(mappedPages);
        } catch (err) {
            console.error('Error fetching pages:', err);
            setPages([]);
        }
    };

    const Logout = () => {
        const navigate = useNavigate();
        useEffect(() => {
            const performLogout = async () => {
                try {
                    await axios.get('/api/logout', { withCredentials: true });
                } catch (err) {
                    console.error('Logout error', err);
                } finally {
                    navigate('/', { replace: true });
                    setUser(null);
                    setLoading(false);
                }
            };
            performLogout().then();
        }, [navigate]);
        return null;
    };

    const CheckManagerAccess = async () => {
        try {
            const res = await axios.get('/api/access', { withCredentials: true });
            console.log(res.data.manager_access);
            setHasManagerAccess(res.data.manager_access);
            return res.data.manager_access;
        } catch (err) {
            console.error('Manager access check error: ', err);
            setHasManagerAccess(false);
            return false;
        }
    };

    const ToggleManagerView = async (isManagerView) => {
        setLoading(true);
        try {
            const hasManagerAccess = await CheckManagerAccess();

            if (!isManagerView || hasManagerAccess) {
                const res = await axios.post('/api/manager-view',
                    { user: user, manager_view: isManagerView },
                    { withCredentials: true }
                );

                if (res.data.success) {
                    setUser((prev) => ({ ...prev, manager_view: isManagerView }));
                    setManagerView(isManagerView);
                    await fetchPages();
                }
            }
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAccess().then();
    }, [checkAccess]);

    if (loading) {
        return <Loading />;
    }
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    managerView ?
                        <ManagerView
                            user={user}
                            pages={pages}
                            switchView={ToggleManagerView}
                            navCollapsed={managerNavCollapsed}
                            setNavCollapsed={setManagerNavCollapsed}
                        />
                        :
                        <StaffView
                            user={user}
                            pages={pages}
                            switchView={ToggleManagerView}
                            hasManagerAccess={hasManagerAccess}
                        />
                }>
                    {pages
                        .filter((page) => user.role >= page.minRole)
                        .map((page) =>
                            page.component ? (
                                <Route
                                    key={page.path}
                                    path={page.path}
                                    element={<page.component />}
                                    index={page.path === '/'}
                                />
                            ) : (
                                <Route key={page.path} path={page.path}>
                                    {page.subpages
                                        .filter((subpage) => user.role >= subpage.minRole)
                                        .map((subpage) => (
                                            <Route
                                                key={`${page.path}/${subpage.path}`}
                                                path={subpage.path}
                                                index={subpage.path === ''}
                                                element={<subpage.component />}
                                            />
                                        ))}
                                </Route>
                            )
                        )}
                    <Route path="logout" element={<Logout />} />
                    <Route path="not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Route>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
            </Routes>
        </Router>
    );
};

export default App;
