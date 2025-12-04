// FRONTEND/components/Roles/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useRoles} from '../../hooks/useResource';
import Details from '../Details';

const RoleDetails = ({ id, modal }) => {
    const { role, loading, fetchRole, deleteRole } = useRoles();
    const { refreshData, refreshTriggers } = useApp();
    const { openDialog, openModal, openPopUp, closeTopModal } = useNav();

    useEffect(() => {
        const reload = refreshTriggers?.role?.data === parseInt(id);
        if (reload) delete refreshTriggers.role;
        if (id && (!role || reload)) fetchRole({id, reload}).then();
    }, [fetchRole, role, id, refreshTriggers.role]);

    const handleDelete = useCallback(() => {
        let message = 'Are you sure you want to delete this Role?'
        const userCount = role?.users?.length;

        if (userCount)
            message += ` This Role is currently assigned to ${userCount} User${userCount > 1 ? 's' : ''}.`
        message += ' This action cannot be undone.';

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteRole({id});
                if (!success) return;
                refreshData('roles', true);
                closeTopModal();
            },
        });
    }, [id, role, openPopUp, deleteRole, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Role ID',
        },
        buttons: !role?.system_default ? {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'roleEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        } : null
    }), [role, openModal, id, handleDelete]);

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
                        onClick: (id) => {openDialog({ content: 'userDetails', contentId: id, closeButton: false })}
                    }
                }
            }
        }
    }), [openDialog]);

    return <Details
        header={header}
        sections={sections}
        data={role}
        modal={modal}
        loading={loading}
        placeholder={'Role not found!'}
    />;
};

export default RoleDetails;