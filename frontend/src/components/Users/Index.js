// FRONTEND/components/Users/Index.js
import React, { useEffect, useState, useMemo } from 'react';
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import Loader from '../Loader';
import Button from '../Button';
import '../../assets/styles/List.css';
import '../../assets/styles/Users.css';

const UserTableHeader = ({ header, filters, handleFilter, sortConfig, handleSorting }) => {
    return (
        <div className={`app-list-header-cell ${header.key}`} key={header.key}>
            <div className={'app-list-header-cell-label'}>
                {header.title}
            </div>
            <div className={'app-list-header-cell-actions'}>
                <input
                    className='search'
                    title={header.title}
                    placeholder={`Filter by the ${header.title.toLowerCase()}...`}
                    name={header.key}
                    value={filters[header.key] || ''}
                    onChange={handleFilter}
                />
                <Button
                    className={`order ${sortConfig.key === header.key ? sortConfig.direction : ''}`}
                    name={header.key}
                    onClick={handleSorting}
                    icon={sortConfig.key === header.key &&
                    sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                />
            </div>
        </div>
    );
}

const UsersTable = ({ users, loading, managers=true, managed_users=false }) => {
    const { openModal } = useModals();

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const headers = useMemo(() => {
        let baseHeaders = [
            { title: 'Name', key: 'name' },
            { title: 'Roles', key: 'roles' }
        ];
        if (managers) {
            baseHeaders.push({ title: 'Managers', key: 'managers' });
        }
        if (managed_users) {
            baseHeaders.push({ title: 'Managed Users', key: 'managed_users' });
        }
        return baseHeaders;
    }, [managers, managed_users]);

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
                    const trueValues = ['active', 'true', 'yes', '1', 1, 'y'];
                    const falseValues = ['not', 'non', 'not-active', 'no', 'n', 'false', '0', 0]
                    return (trueValues.includes(filterValue.toLowerCase()) && user[key]) || (falseValues.includes(filterValue.toLowerCase()) && !user[key]);
                }

                if (key === 'managers') {
                    return (user.managers || []).some(manager =>
                        (manager.first_name + ' ' + manager.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }

                if (key === 'managed_users') {
                    return (user['managed_users'] || user['managed-users'] || []).some(mu =>
                        (mu.first_name + ' ' + mu.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }

                return user[key]?.toLowerCase().includes(value.toLowerCase());
            });
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'name') {
                    aValue = (a.first_name + ' ' + a.last_name).toLowerCase();
                    bValue = (b.first_name + ' ' + b.last_name).toLowerCase();
                } else if (sortConfig.key === 'active') {
                    aValue = a.active ? 'active' : 'not';
                    bValue = b.active ? 'active' : 'not';
                } else if (sortConfig.key === 'managers') {
                    aValue = (a.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                    bValue = (b.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                } else {
                    aValue = a[sortConfig.key]?.toLowerCase?.() ?? '';
                    bValue = b[sortConfig.key]?.toLowerCase?.() ?? '';
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
        <div className='app-list seethrough app-overflow-hidden app-centered users-list'>
            <div className='app-list-header-row'>
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
            <div className='app-list-content app-overflow-y app-scroll'>
                { filteredAndSortedUsers?.length === 0 ? (
                    <p>No users found.</p>
                ) : (filteredAndSortedUsers?.map(user => {
                    const roles = user.roles || [];
                    const displayedRoles = roles.slice(0, 1);
                    const moreRolesCount = roles.length - 1;
                    const moreRolesText = moreRolesCount > 0 ? `+${moreRolesCount} other roles` : '';

                    return (
                        <div className='app-list-row' key={user.id}>
                            <div className={'app-list-row-cell name app-clickable'} onClick={() => openModal({ content: 'userDetails', type: 'dialog', contentId: user.id })}>
                                {user.first_name} {user.last_name}
                            </div>
                            <div className={'app-list-row-cell roles'}>
                                {displayedRoles.map((role) => (
                                    <span key={role.id} className='role-name app-clickable'
                                          onClick={() => openModal({ content: 'roleDetails', type: 'dialog', contentId: role.id })}
                                    > {role.name} </span>
                                ))}
                                {moreRolesText}
                            </div>
                            {managers && (
                                <div className={'app-list-row-cell managers'}>
                                    {(user.managers || []).length === 0
                                        ? <span>-</span>
                                        : (user.managers || []).map(manager =>
                                            <span key={manager.id} className='manager-name app-clickable'
                                                onClick={() => openModal({ content: 'userDetails', contentId: manager.id })}
                                            >{manager.first_name} {manager.last_name}</span>
                                        ).reduce((prev, curr) => [prev, ', ', curr])
                                    }
                                </div>
                            )}
                            {managed_users && (
                                <div className={'app-list-row-cell managed-users'}>
                                    {((user.managed_users || user['managed-users']) || []).length === 0
                                        ? <span>-</span>
                                        : ((user.managed_users || user['managed-users']) || []).length
                                    }
                                </div>
                            )}
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}

export const ManagersIndex = () => {
    const { openModal, refreshTriggers } = useModals();
    const { users, usersLoading, fetchUsers } = useUser();

    useEffect(() => {
        if (!users) {
            fetchUsers('managers').then();
        }
    }, [fetchUsers, users]);

    useEffect(() => {
        if (refreshTriggers?.users) {
            fetchUsers('managers').then();
        }
    }, [refreshTriggers, fetchUsers]);

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Managers of Zyrah </h1>
                <Button
                    className='new-user'
                    onClick={() => openModal({ content: 'managerNew' })}
                    label={'Add manager'}
                    icon={'add'}
                />
            </div>
            <UsersTable
                users={users}
                loading={usersLoading}
                managed_users={true}
            />
        </>
    );
}

export const EmployeesIndex = () => {
    const { openModal, refreshTriggers } = useModals();
    const { users, usersLoading, fetchUsers } = useUser();

    useEffect(() => {
        if (!users) {
            fetchUsers('employees').then();
        }
    }, [fetchUsers, users]);

    useEffect(() => {
        if (refreshTriggers?.users) {
            fetchUsers('employees').then();
        }
    }, [refreshTriggers, fetchUsers]);

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Employees of Zyrah </h1>
                <Button
                    className='new-user'
                    onClick={() => openModal({ content: 'employeeNew' })}
                    label={'Add employee'}
                    icon={'add'}
                />
            </div>
            <UsersTable
                users={users}
                loading={usersLoading}
            />
        </>
    );
};

export const UsersIndex = () => {
    const { openModal, refreshTriggers } = useModals();
    const { users, usersLoading, fetchUsers } = useUser();

    useEffect(() => {
        if (!users) {
            fetchUsers().then();
        }
    }, [fetchUsers, users]);

    useEffect(() => {
        if (refreshTriggers?.users) {
            fetchUsers().then();
        }
    }, [fetchUsers, refreshTriggers]);

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Users of Zyrah </h1>
                <Button
                    className='new-user'
                    onClick={() => openModal({content: 'userNew'})}
                    label={'Add user'}
                    icon={'add'}
                />
            </div>
            <UsersTable
                users={users}
                loading={usersLoading}
            />
        </>
    );
};

export default UsersIndex;