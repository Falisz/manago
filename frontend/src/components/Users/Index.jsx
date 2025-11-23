// FRONTEND/Components/Users/Index.jsx
import React, { useCallback, useEffect, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import useUsers from '../../hooks/useUsers';
import Loader from '../Loader';
import Table from '../Table';

const UsersIndexPage = ({content='users'}) => {
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openPopUp, closeTopModal } = useNav();
    const { users, loading, fetchUsers, deleteUser, deleteUsers } = useUsers();

    useEffect(() => {
        const refresh = refreshTriggers?.users || false;
        if (refresh) delete refreshTriggers.users;
        if (!users || refresh) fetchUsers({group: content}).then();
    }, [content, users, refreshTriggers, fetchUsers]);

    const handleUserDelete = useCallback((id) => {
        openPopUp({
            content: 'confirm',
            message: 'Are you sure you want to delete this User? This action cannot be undone.',
            onConfirm: async () => {
                const success = await deleteUser({userId: id});
                if (!success) return;
                refreshData('users', true);
                closeTopModal();
            },
        });
    }, [closeTopModal, deleteUser, openPopUp, refreshData]);

    const handleUsersDelete = useCallback((selectedUsers) => {
        openPopUp({
            content: 'confirm',
            message: `Are you sure you want to delete ${selectedUsers.size}`+
                ` selected User${selectedUsers.size > 1 ? 's' : ''}? This action cannot be undone.`,
            onConfirm: async () => {
                const success = await deleteUsers({userIds: Array.from(selectedUsers)});
                if (!success) return;
                refreshData('users', true);
                closeTopModal();
            },
        });
    }, [closeTopModal, deleteUsers, openPopUp, refreshData]);

    const header = useMemo(() => ({
        title: content.charAt(0).toUpperCase() + content.slice(1),
        itemName: content.charAt(0).toUpperCase() + content.slice(1,-1),
        allElements: new Set(users?.map(user => user.id)),
        newItemModal: content === 'employees' ? 'employeeNew' :
            content === 'managers' ? 'managerNew' : 'userNew'
    }), [users, content]);

    const fields = useMemo(() => ({
        0: {
            label: 'Name',
            name: 'name',
            type: 'string',
            openModal: 'userDetails'
        },
        1: {
            label: 'Roles',
            name: 'roles',
            type: 'list',
            openModal: 'roleDetails'
        },
        2: {
            label: 'Managers',
            name: 'managers',
            type: 'list',
            openModal: 'userDetails'
        },
        3: {
            label: 'Users Count',
            name: 'users_count',
            type: 'number',
            value: (data) => data.managed_users?.length || 0,
            display: content === 'managers',
            style: {maxWidth: '100px'}
        }
    }), [content]);

    const contextMenuActions = useMemo(() => ([
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
                data: users?.filter(user => selectedUsers.has(user.id)), style: {overflow: 'unset'}}) },
        { id: 'bulk-assign-manager', label: 'Assign Manager', selectionMode: true,
            onClick: (selectedUsers) => openModal({content: 'userManagerBulkAssignment', type: 'dialog',
                data: users?.filter(user => selectedUsers.has(user.id)), style: {overflow: 'unset'}}) },
        { id: 'bulk-delete', label: 'Delete Selected', selectionMode: true,
            onClick: (selectedUsers) => handleUsersDelete(selectedUsers) }
    ]), [openModal, users, handleUserDelete, handleUsersDelete]);

    if (loading) 
        return <Loader />;

    return (
        <Table
            data={users}
            header={header}
            fields={fields}
            sortable={true}
            filterable={true}
            contextMenuActions={contextMenuActions}
            selectableRows={true}
            dataPlaceholder={'No Users found.'}
        />
    );

}

export const ManagersIndex = () => <UsersIndexPage content={'managers'} />

export const EmployeesIndex = () => <UsersIndexPage content={'employees'} />

export const UsersIndex = () => <UsersIndexPage />;

export default UsersIndex;