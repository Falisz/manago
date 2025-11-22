// FRONTEND/components/Users/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import useUsers from '../../hooks/useUsers';
import Details from '../Details';
import Loader from '../Loader';

const UserDetails = ({ userId }) => {
    const { user, loading, fetchUser, deleteUser } = useUsers();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openPopUp, closeTopModal } = useNav();

    useEffect(() => {
        const refresh = refreshTriggers.user?.data === userId;

        if (refresh)
            delete refreshTriggers.user;

        if (userId && (!user || refresh))
            fetchUser({userId, reload: refresh}).then();

    }, [fetchUser, user, userId, refreshTriggers.user]);

    const handleDelete = useCallback(() => {
        const deletePopUp = {
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            onConfirm: async () => {
                const success = await deleteUser({userId});
                if (!success) return;
                refreshData('users', true);
                closeTopModal();
            },
        }
        openPopUp(deletePopUp);
    }, [userId, openPopUp, deleteUser, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        prefix: {
            dataField: 'id',
            title: 'User ID',
        },
        title: {
            dataField: ['first_name', 'last_name'],
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                title: 'Edit User',
                onClick: () => openModal({content: 'userEdit', contentId: userId})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                title: 'Delete User',
                onClick: handleDelete
            }
        }
    }), [openModal, userId, handleDelete]);

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
                    onClick: () => openModal({content: 'userRoleAssignment', data: user, type: 'dialog'})
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
                        onClick: (id) => openModal({ content: 'roleDetails', contentId: id, type: 'dialog' })
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
                    onClick: () => openModal({content: 'userManagerAssignment', data: user, type: 'dialog'}),
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
                        onClick: (id) => {openModal({ content: 'userDetails', contentId: id, type: 'dialog' })}
                    }
                }
            }
        },
        4: {
            header: {
                text: 'Reportees',
                button: {
                    onClick: () => openModal({content: 'userReporteeAssignment', data: [user], type: 'dialog'}),
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
                        onClick: () => {openModal({ content: 'userDetails', contentId: userId, type: 'dialog'})}
                    }
                }
            },
            hideEmpty: true
        }
    }), [user, userId, openModal]);

    if (loading) 
        return <Loader />;

    if (!user)
        return <h1>User not found!</h1>;

    return <Details header={header} sections={sections} data={user} />;
};

export default UserDetails;