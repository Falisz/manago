// FRONTEND/components/Users/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useUsers} from '../../hooks/useResource';
import Details from '../Details';

const UserDetails = ({ id, modal }) => {
    const { user, loading, fetchUser, deleteUser } = useUsers();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openDialog, openPopUp, closeTopModal } = useNav();

    useEffect(() => {
        const reload = refreshTriggers.user?.data === parseInt(id);
        if (reload) delete refreshTriggers.user;
        if (id && (!user || reload)) fetchUser({id, reload}).then();
    }, [fetchUser, user, id, refreshTriggers.user]);

    const handleDelete = useCallback(() => {
        const deletePopUp = {
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            onConfirm: async () => {
                const success = await deleteUser({id});
                if (!success) return;
                refreshData('users', true);
                closeTopModal();
            },
        }
        openPopUp(deletePopUp);
    }, [id, openPopUp, deleteUser, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        title: {
            dataField: ['first_name', 'last_name'],
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'User ID',
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'userEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [openModal, id, handleDelete]);

    const sections = useMemo(() => ({
        0: {
            header: 'Login Details',
            fields: {
                0: {
                    label: 'Login ID',
                    dataType: 'string',
                    dataField: 'id'
                },
                1: {
                    label: 'Login Alias',
                    dataType: 'string',
                    dataField: 'login'
                },
                2: {
                    label: 'Login Email',
                    dataType: 'string',
                    dataField: 'email'
                }
            }
        },
        1: {
            header: {
                text: 'Roles',
                button: {
                    onClick: () => openDialog({content: 'userRoleAssignment', data: user, closeButton: false})
                }
            },
            fields: {
                0: {
                    dataType: 'list',
                    dataField: 'roles',
                    placeholder: 'No Roles assigned.',
                    items: {
                        idField: 'id',
                        dataField: 'name',
                        onClick: (id) => openDialog({ content: 'roleDetails', contentId: id, closeButton: false })
                    }
                }
            }
        },
        2: {
            header: 'Status',
            fields: {
                0: {
                    linear: true,
                    dataType: 'boolean',
                    dataField: 'active',
                    trueValue: 'User\'s account is active.',
                    trueIcon: 'check',
                    falseValue: 'User\'s account is not active.',
                    falseIcon: 'close',
                },
                1: {
                    linear: true,
                    dataType: 'boolean',
                    dataField: 'manager_view_access',
                    trueValue: 'User has access to the Manager Portal.',
                    trueIcon: 'check',
                    falseValue: 'User doesn\'t have access to the Manager Portal.',
                    falseIcon: 'close',
                }
            }
        },
        3: {
            header: {
                text: 'Managers',
                button: {
                    onClick: () => openDialog({content: 'userManagerAssignment', data: user}),
                }
            },
            fields: {
                0: {
                    dataType: 'list',
                    dataField: 'managers',
                    placeholder: 'No Managers assigned.',
                    items: {
                        idField: 'id',
                        dataField: ['first_name', 'last_name'],
                        onClick: (id) => {openDialog({ content: 'userDetails', contentId: id, closeButton: false })}
                    }
                }
            }
        },
        4: {
            header: {
                text: 'Reportees',
                button: {
                    onClick: () => openDialog({ content: 'userReporteeAssignment', data: [user] }),
                }
            },
            fields: {
                0: {
                    type: 'data-group',
                    dataType: 'list',
                    dataField: 'managed_users',
                    items: {
                        idField: 'id',
                        dataField: ['first_name', 'last_name'],
                        onClick: (id) => {openDialog({ content: 'userDetails', contentId: id, closeButton: false })}
                    }
                }
            },
            hideEmpty: true
        }
    }), [user, openDialog]);

    return <Details
        header={header}
        sections={sections}
        data={user}
        modal={modal}
        loading={loading}
        placeholder={'User not found!'}
    />;
};

export default UserDetails;