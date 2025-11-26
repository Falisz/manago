// FRONTEND/components/Roles/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useRoles} from '../../hooks/useResource';
import Details from '../Details';
import Loader from '../Loader';

const RoleDetails = ({ roleId }) => {
    const { role, loading, fetchRole, deleteRole } = useRoles();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, closeTopModal } = useNav();

    useEffect(() => {
        const refresh = refreshTriggers?.role?.data === parseInt(roleId);

        if (refresh)
            delete refreshTriggers.role;

        if (roleId && (!role || refresh))
            fetchRole({roleId, reload: refresh}).then();

    }, [fetchRole, role, roleId, refreshTriggers.role]);

    const handleDelete = useCallback((users = 0) => {
        let message = 'Are you sure you want to delete this role? This action cannot be undone.'
        if (users > 0) {
            message += ` This role is currently assigned to ${users} user${users > 1 ? 's' : ''}.`
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: async () => {
                const success = await deleteRole({roleId});
                if (!success) return;
                refreshData('roles', true);
                closeTopModal();
            },
        });
    }, [roleId, openModal, deleteRole, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        prefix: {
            dataField: 'id',
            title: 'Role ID',
        },
        title: {
            dataField: 'name',
        },
        buttons: !role?.system_default ? {
            edit: {
                className: 'edit',
                icon: 'edit',
                title: 'Edit User',
                onClick: () => openModal({content: 'roleEdit', contentId: roleId})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                title: 'Delete User',
                onClick: handleDelete
            }
        } : null
    }), [role, openModal, roleId, handleDelete]);

    const sections = useMemo(() => ({
        0: {
            header: 'Role Details',
            fields: {
                0: {
                    label: 'Description',
                    dataType: 'string',
                    dataField: 'description',
                },
                1: {
                    label: 'Type',
                    dataType: 'boolean',
                    dataField: 'system_default',
                    trueValue: 'This is system default role. It cannot be edited nor deleted.',
                    trueIcon: 'check',
                    falseValue: 'This is custom default role. It can be edited and deleted.',
                    falseIcon: 'check',
                }
            }
        },
        1: {
            header: 'Users with this Role',
            fields: {
                0: {
                    dataType: 'list',
                    dataField: 'users',
                    placeholder: 'No Users with this Role.',
                    items: {
                        dataField: ['first_name', 'last_name'],
                        onClick: (id) => {openModal({ content: 'userDetails', contentId: id, type: 'dialog' })}
                    }
                }
            }
        }
    }), [openModal]);

    if (loading)
        return <Loader />;

    if (!role)
        return <h1>Role not found!</h1>;

    return <Details header={header} sections={sections} data={role} />;
};

export default RoleDetails;