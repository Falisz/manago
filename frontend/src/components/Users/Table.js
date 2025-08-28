// FRONTEND/components/Users/Table.js
import React, { useMemo, useState } from "react";
import { useModals } from "../../contexts/ModalContext";
import Loader from "../Loader";

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

const UsersTable = ({ users, loading }) => {
    const { openModal } = useModals();

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    })

    const headers = [
        {title: 'Name', key: 'name'},
        {title: 'E-mail Address', key: 'email'},
        {title: 'Roles', key: 'roles'},
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
        if (!users)
            return null;

        let result = [...users];

        result = result.filter(user => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                if (key === 'name') {
                    return (user.first_name + ' ' + user.last_name)?.toLowerCase().includes(value.toLowerCase());
                }

                if (key === 'roles') {
                    return user.roles?.some(role =>
                        role.name?.toLowerCase().includes(value.toLowerCase())
                    );
                }

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

    if (loading) {
        return <Loader />;
    }

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
                { filteredAndSortedUsers?.length === 0 ? (
                    <p>No users found.</p>
                ) : (filteredAndSortedUsers?.map(user => {
                    const roles = user.roles || [];
                    const displayedRoles = roles.slice(0, 2);
                    const moreRolesCount = roles.length - 2;
                    const moreRolesText = moreRolesCount > 0 ? `+${moreRolesCount} other roles` : '';

                    return (
                        <div className="users-list-row" key={user.user}>
                            <div onClick={() => openModal({ type: 'userDetails', data: { id: user.ID } })}> {/* CHANGED: Use openModal instead of navigate */}
                                {user.first_name} {user.last_name}
                            </div>
                            <div>{user.email}</div>
                            <div>
                                {displayedRoles.map((role) => (
                                    <span key={role.ID} className="role-name"
                                          onClick={() => openModal({ type: 'roleDetails', data: { id: role.ID } })} // Example for role; implement if needed
                                    > {role.name} </span>
                                ))}
                                {moreRolesText}
                            </div>
                            <div>{user.active ? 'Active' : 'Not'}</div>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}

export default UsersTable;