// FRONTEND/Components/Users/Index.jsx
import React, { useCallback, useEffect, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import useUsers from '../../hooks/useUsers';
import Loader from '../Loader';
import Table from '../Table';

const UsersIndexPage = ({content='users'}) => {
    const { openModal, refreshData, closeTopModal, refreshTriggers } = useApp();
    const { users, loading, fetchUsers, deleteUser, deleteUsers } = useUsers();

    useEffect(() => {

        const refresh = refreshTriggers?.users || false;

        if (refresh)
            delete refreshTriggers.users;

        if (!users || refresh)
            fetchUsers({group: content}).then();

    }, [content, users, refreshTriggers, fetchUsers]);

    const handleUserDelete = useCallback((id) => {
        openModal({
                    content: 'confirm',
                    type: 'pop-up',
                    message: 'Are you sure you want to delete this user? This action cannot be undone.',
                    onConfirm: () => {
                        deleteUser({userId: id}).then();
                        refreshData('users', true);
                        closeTopModal();
                    },
                });
    }, [closeTopModal, deleteUser, openModal, refreshData]);

    const handleUsersDelete = useCallback((selectedUsers) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: `Are you sure you want to delete ${selectedUsers.size} selected User${selectedUsers.size > 1 ? 's' : ''}? This action cannot be undone.`,
            onConfirm: () => {
                deleteUsers({userIds: selectedUsers}).then();
                refreshData('users', true);
                closeTopModal();
            },
        });
    }, [closeTopModal, deleteUsers, openModal, refreshData]);

    const tableStructure = useMemo(() => ({
        pageHeader: {
            title: content.charAt(0).toUpperCase() + content.slice(1),
            itemName: content.charAt(0).toUpperCase() + content.slice(1,-1),
            allElements: new Set(users?.map(user => user.id)),
            newItemModal: content === 'employees' ? 'employeeNew' :
                            content === 'managers' ? 'managerNew' : 'userNew'
        },
        tableFields: {
            name: {
                title: 'Name',
                display: true,
                sortable: true,
                filterable: true,
                type: 'string',
                openModal: 'userDetails'
            },
            roles: {
                title: 'Roles',
                display: true,
                sortable: true,
                filterable: true,
                type: 'list',
                openModal: 'roleDetails'
            },
            managers: {
                title: 'Managers',
                display: true,
                sortable: true,
                filterable: true,
                type: 'list',
                openModal: 'userDetails'
            },
            users_count: {
                title: 'Users Count',
                display: content === 'managers',
                sortable: true,
                filterable: true,
                style: {maxWidth: 100+'px'},
                type: 'number',
                computeValue: (data) => data.managed_users?.length || 0
            }
        },
        hasHeader: true,
        contextMenuActions: [
            { id: 'select', label: 'Select User', selectionMode: false, 
                select: 'id' },
            { id: 'edit', label: 'Edit User', selectionMode: false, 
                onClick: (props) => openModal({content: 'userEdit', contentId: props.id}) },
            { id: 'assign-role', label: 'Edit Roles', selectionMode: false, 
                onClick: (props) => openModal({content: 'userRoleAssignment', type: 'dialog',
                    data: props, style: {overflow: 'unset'}}) },
            { id: 'assign-manager', label: 'Edit Managers', selectionMode: false,
                onClick: (props) => openModal({content: 'userManagerAssignment', type: 'dialog',
                    data: props, style: {overflow: 'unset'}}) },
            { id: 'delete', label: 'Delete User', selectionMode: false,
                onClick: (props) => handleUserDelete(props.id) },
            { id: 'select-all', label: 'Select All', selectionMode: true, 
                setSelected: new Set(users?.map(user => user.id)) },
            { id: 'clear-selection', label: 'Clear Selection', selectionMode: true, 
                setSelected: new Set() },
            { id: 'bulk-assign-role', label: 'Assign Role', selectionMode: true,
                onClick: (selectedUsers) => openModal({content: 'userRoleBulkAssignment', type: 'dialog',
                    data: users.filter(user => selectedUsers.has(user.id)), style: {overflow: 'unset'}}) },
            { id: 'bulk-assign-manager', label: 'Assign Manager', selectionMode: true,
                onClick: (selectedUsers) => openModal({content: 'userManagerBulkAssignment', type: 'dialog',
                    data: users.filter(user => selectedUsers.has(user.id)), style: {overflow: 'unset'}}) },
            { id: 'bulk-delete', label: 'Delete Selected', selectionMode: true,
                onClick: (selectedUsers) => handleUsersDelete(selectedUsers) }
        ]
    }), [content, handleUserDelete, handleUsersDelete, openModal, users]);

    if (loading) 
        return <Loader />;

    return (
        <Table
            dataSource={users}
            tableStructure={tableStructure}
            hasSelectableRows={true}
            dataPlaceholder={'No Users found.'}
        />
    );

}

export const ManagersIndex = () => <UsersIndexPage content={'managers'} />

export const EmployeesIndex = () => <UsersIndexPage content={'employees'} />

export const UsersIndex = () => <UsersIndexPage />;

export default UsersIndex;