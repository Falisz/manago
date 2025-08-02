import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import Loader from "../Loader";
import '../../assets/styles/Users.css';
import UserEdit from "./Edit";
import Modal from "../Modal";

const UserDetail = ({ userId, handleDelete }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await axios.get(`/users/${userId}`, { withCredentials: true });
                if (res.data)
                    setUser(res.data);
                else
                    setError('User not found');
                setLoading(false);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('User not found!');
                setLoading(false);
            }
        };
        fetchPost().then();
    }, [userId]);

    if (loading) {
        return (
            <Loader />
        );
    }

    if (error) {
        return (
            <h1>{error}</h1>
        );
    }

    return (
        <>
            <h1>{user?.first_name + ' ' + user?.last_name}</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="user-detail">
                <pre>
                    {JSON.stringify(user, ' ', 2)}
                </pre>
                <button type="button" className="button" onClick={() => navigate('/employees/edit/' + user.user)}>
                    <i className={'material-symbols-outlined'}>edit</i> Edit Employee
                </button>
                <button type="button" className="delete-button" onClick={handleDelete}>
                    <i className={'material-symbols-outlined'}>delete</i>  Delete Employee
                </button>
            </div>
        </>
    );
};

const UserTableHeader = ({ header, filters, handleFilter, sortConfig, handleSorting }) => {
    return (
        <div className="users-list-header-cell" key={header.key}>
            <label>{header.title}</label>
            <input
                className="search"
                title={header.title}
                placeholder={`Filter by the ${header.title.toLowerCase()}...`}
                name={header.key}
                value={filters[header.key] || ''}
                onChange={handleFilter}
            />
            <button
                className={`order ${sortConfig.key === header.key ? sortConfig.direction : ''}`}
                name={header.key}
                onClick={handleSorting}
            >
                {sortConfig.key === header.key && sortConfig.direction === 'asc' ? '↑' : '↓'}
            </button>
        </div>
    );
}

const UsersTable = ({ users, refreshUsers, loading, error }) => {
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const navigate = useNavigate();

    const headers = [
        {title: 'First Name', key: 'first_name'},
        {title: 'Last Name', key: 'last_name'},
        {title: 'E-mail Address', key: 'email'},
        {title: 'Active', key: 'active'}
    ]

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        if (value.trim() !== '') {
            e.target.classList.add('non-empty');
        } else {
            e.target.classList.remove('non-empty');
        }
    };

    const handleSorting = (e) => {
        const field = e.target.name;
        e.target.classList.add('active');
        setSortConfig(prev => ({
            key: field,
            direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users];

        result = result.filter(user => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                if (key === 'active') {
                    const filterValue = value.toLowerCase();
                    return (filterValue === 'active' && user[key]) || (filterValue === 'not' && !user[key]);
                }

                return user[key]?.toLowerCase().includes(value.toLowerCase());
            });
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'active') {
                    aValue = aValue ? 'active' : 'not';
                    bValue = bValue ? 'active' : 'not';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [users, filters, sortConfig]);

    useEffect(() => {
        refreshUsers();
    }, [refreshUsers]);

    if (loading)
        return <Loader />;

    if (error)
        return <>{error}</>;

    return (
        <div className="users-list">
            <div className="users-list-header">
                {headers.map((header) => (
                    <UserTableHeader
                        header={header}
                        filters={filters}
                        handleFilter={handleFilter}
                        sortConfig={sortConfig}
                        handleSorting={handleSorting}
                        key={header.key}
                    />
                ))}
            </div>
            <div className="users-list-content">
                { filteredAndSortedUsers.length === 0 ? (
                    <p>No users found.</p>
                ) : (filteredAndSortedUsers.map(user => (
                    <div className="users-list-row" key={user.user} onClick={() => navigate('/employees/' + user.user)}>
                        <div>{user.first_name}</div>
                        <div>{user.last_name}</div>
                        <div>{user.email}</div>
                        <div>{user.active ? 'Active' : 'Not'}</div>
                    </div>
                )))}
            </div>
        </div>
    );
}

const UsersIndex = () => {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/users', { withCredentials: true });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/users/${userId}`, { withCredentials: true });
        } catch (err) {
            console.error('Error deleting user:', err);
        } finally {
            refreshUsers().then();
            goBack();
        }
    };

    const goBack = (userId) => {
        if (showEditModal && userId) {
            setShowEditModal(false);
            navigate('/employees/' + userId);
        } else {
            setShowEditModal(false);
            setShowDetailModal(false);
            navigate('/employees/');
        }
    }

    useEffect(() => {
        const isEditMode = location.pathname.includes('/new') || location.pathname.includes('/edit')

        if (userId) {
            setSelectedUserId(parseInt(userId));
            setShowDetailModal(true);
        } else {
            setSelectedUserId(null);
        }

        setShowEditModal(isEditMode);

    }, [userId, location.pathname]);

    return (
        <>
            <h1>Employees of Zyrah</h1>
            <button className="new-user-button" onClick={() => navigate('/employees/new')}>
                + Add Employee
            </button>

            <UsersTable
                users={users}
                refreshUsers={refreshUsers}
                loading={loading}
                error={error}
            />

            <Modal
                hidden={!showDetailModal}
                onClose={goBack}
                closeButton={true}
                key={'detail'}>
                {selectedUserId &&
                    <UserDetail
                        userId={selectedUserId}
                        handleDelete={()=>{handleDelete(selectedUserId).then()}}
                    />
                }
            </Modal>

            <Modal
                hidden={!showEditModal}
                onClose={() => {goBack(selectedUserId)}}
                closeButton={true}
                key={'edit-form'}>
                <UserEdit
                    userId={selectedUserId}
                    onSave={refreshUsers}
                />
            </Modal>
        </>
    );
};

export default UsersIndex;