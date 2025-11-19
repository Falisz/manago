// FRONTEND/components/Roles/Details.js
import React, {useEffect} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import useRoles from '../../hooks/useRoles';
import Details from '../Details';
import Loader from '../Loader';

const RoleDetails = ({ roleId }) => {
    const { role, loading, fetchRole, deleteRole } = useRoles();
    const { refreshTriggers, refreshData } = useApp();
    const { openModal, closeTopModal } = useNav();

    useEffect(() => {
        const refresh = refreshTriggers?.role?.data === parseInt(roleId);

        if (refresh)
            delete refreshTriggers.role;

        if (roleId && (!role || refresh))
            fetchRole({roleId, reload: refresh}).then();

    }, [fetchRole, role, roleId, refreshTriggers.role]);

    const handleDelete = async (users = 0) => {
        let message = 'Are you sure you want to delete this role? This action cannot be undone.'
        if (users > 0) {
            message += ` This role is currently assigned to ${users} user${users > 1 ? 's' : ''}.`
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: () => {
                deleteRole(roleId).then();
                refreshData('roles', true);
                closeTopModal();
            },
        });
    };

    const roleStructure = {
        header: {
            type: 'header',
            titlePrefix: {
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
                    onClick: () => openModal({content: 'roleEdit', contentId: role.id})
                },
                delete: {
                    className: 'delete',
                    icon: 'delete',
                    title: 'Delete User',
                    onClick: handleDelete
                }
            } : null
        },
        detailsSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Role Details'
            },
            descGroup: {
                type: 'data-group',
                label: 'Description',
                dataType: 'string',
                dataField: 'description',
            },
            typeGroup: {
                type: 'data-group',
                label: 'Type',
                dataType: 'boolean',
                dataField: 'system_default',
                trueValue: 'This is system default role. It cannot be edited nor deleted.',
                trueIcon: 'check',
                falseValue: 'This is custom default role. It can be edited and deleted.',
                falseIcon: 'check',
            }
        },
        usersSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Users with this Role'
            },
            usersGroup: {
                type: 'data-group',
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

    if (loading)
        return <Loader />;

    if (!role)
        return <h1>Role not found!</h1>;

    return <Details data={role} structure={roleStructure} />;
};

export default RoleDetails;