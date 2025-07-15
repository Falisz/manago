import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Loading } from './Common';
import './Users.css';

const UsersIndex = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        first_name: '',
        last_name: '',
        email: '',
        active: ''
    });
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users', { withCredentials: true });
                setUsers(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users. Please try again later.');
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

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
            return (
                user.first_name.toLowerCase().includes(filters.first_name.toLowerCase()) &&
                user.last_name.toLowerCase().includes(filters.last_name.toLowerCase()) &&
                user.email.toLowerCase().includes(filters.email.toLowerCase()) &&
                (filters.active === '' ||
                    (filters.active.toLowerCase() === 'active' && user.active) ||
                    (filters.active.toLowerCase() === 'not' && !user.active))
            );
        });

        // Apply sorting
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

    if (loading) return <Loading />;
    if (error) return <>{error}</>;

    return (
        <div className="users-index">
            <div className="users-list">
                <div className="users-list-header">
                    <div className="users-list-header-cell">
                        <label>First Name</label>
                        <input
                            title="First name"
                            placeholder="Filter by the first name..."
                            className="search"
                            name="first_name"
                            value={filters.first_name}
                            onChange={handleFilter}
                        />
                        <button
                            className={`order ${sortConfig.key === 'first_name' ? sortConfig.direction : ''}`}
                            name="first_name"
                            onClick={handleSorting}
                        >
                            {sortConfig.key === 'first_name' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                    <div className="users-list-header-cell">
                        <label>Last Name</label>
                        <input
                            title="Last name"
                            placeholder="Filter by the last name..."
                            className="search"
                            name="last_name"
                            value={filters.last_name}
                            onChange={handleFilter}
                        />
                        <button
                            className={`order ${sortConfig.key === 'last_name' ? sortConfig.direction : ''}`}
                            name="last_name"
                            onClick={handleSorting}
                        >
                            {sortConfig.key === 'last_name' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                    <div className="users-list-header-cell">
                        <label>Email</label>
                        <input
                            title="E-mail"
                            placeholder="Filter by the e-mail..."
                            className="search"
                            name="email"
                            value={filters.email}
                            onChange={handleFilter}
                        />
                        <button
                            className={`order ${sortConfig.key === 'email' ? sortConfig.direction : ''}`}
                            name="email"
                            onClick={handleSorting}
                        >
                            {sortConfig.key === 'email' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                    <div className="users-list-header-cell">
                        <label>Active</label>
                        <input
                            title="Active"
                            placeholder="Filter by active status..."
                            className="search"
                            name="active"
                            value={filters.active}
                            onChange={handleFilter}
                        />
                        <button
                            className={`order ${sortConfig.key === 'active' ? sortConfig.direction : ''}`}
                            name="active"
                            onClick={handleSorting}
                        >
                            {sortConfig.key === 'active' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
                <div className="users-list-content">
                    {filteredAndSortedUsers.length === 0 ? (
                        <p>No users found.</p>
                    ) : (filteredAndSortedUsers.map(user => (
                        <div className="users-list-row" key={user.user}>
                            <div>{user.first_name}</div>
                            <div>{user.last_name}</div>
                            <div>{user.email}</div>
                            <div>{user.active ? 'Active' : 'Not'}</div>
                            <div className="user-edit"><span className="material-symbols-outlined">edit</span></div>
                        </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsersIndex;