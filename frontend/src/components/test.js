import React, {useEffect} from 'react';
import Details from './Details';
import Loader from './Loader';
import useUser from '../hooks/useUser';
import { useModals } from '../contexts/ModalContext';

const DetailsTest = () => {
    const { user, loading, fetchUser } = useUser();
    const { openModal } = useModals();

    useEffect(() => {
        fetchUser(475776).then();
    }, [fetchUser]);

    const exampleStructure = {
        header: {
            type: 'header',
            titlePrefix: {
                dataField: 'id',
                title: 'Team ID',
            },
            title: {
                dataField: 'name',
            },
            buttons: {
                edit: {
                    className: 'edit',
                    icon: 'edit',
                    title: 'Edit User',
                    onClick: () => openModal({content: 'teamEdit', contentId: user.id})
                },
                delete: {
                    className: 'delete',
                    icon: 'delete',
                    title: 'Delete User',
                    onClick: () => {}
                }
            }
        },
        loginDetailsSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Login Details'
            },
            loginId: {
                type: 'data-group',
                label: 'Login ID',
                dataType: 'string',
                dataField: 'id'
            },
            loginAlias: {
                type: 'data-group',
                label: 'Login Alias',
                dataType: 'string',
                dataField: 'login'
            },
            loginEmail: {
                type: 'data-group',
                label: 'Login Email',
                dataType: 'string',
                dataField: 'email'
            }
        },
        rolesSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Roles',
                editButton: {
                    onClick: (user) => openModal({content: 'userRoleAssignment', data: user, type: 'dialog'}),
                }
            },
            roles: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'roles',
                placeholder: 'No Roles assigned.',
                items: {
                    idField: 'id',
                    dataField: 'name',
                    onClick: (id) => {openModal({ content: 'roleDetails', contentId: id, type: 'dialog' })}
                }
            }
        },
        statusSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Status',
            },
            isActive: {
                type: 'data-group',
                linear: true,
                dataType: 'boolean',
                dataField: 'active',
                trueValue: 'User\'s account is active.',
                trueIcon: 'check',
                falseValue: 'User\'s account is not active.',
                falseIcon: 'close',
            },
            hasManagerView: {
                type: 'data-group',
                linear: true,
                dataType: 'boolean',
                dataField: 'manager_view_access',
                trueValue: 'User has access to the Manager Portal.',
                trueIcon: 'check',
                falseValue: 'User doesn\'t have access to the Manager Portal.',
                falseIcon: 'close',
            }
        },
        managersSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Managers',
                editButton: {
                    onClick: (user) => openModal({content: 'userManagerAssignment', data: [user], type: 'dialog'}),
                }
            },
            managers: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'managers',
                placeholder: 'No Managers assigned.',
                items: {
                    idField: 'id',
                    dataField: ['first_name', 'last_name'],
                    onClick: (id) => {openModal({ content: 'userDetails', contentId: id, type: 'dialog' })}
                }
            }
        },
        reporteesSection: {
            type: 'section',
            hideEmpty: true,
            header: {
                type: 'section-header',
                text: 'Reportees',
                editButton: {
                    onClick: (user) => openModal({content: 'userReporteeAssignment', data: [user], type: 'dialog'}),
                }
            },
            users: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'managed_users',
                items: {
                    idField: 'id',
                    dataField: ['first_name', 'last_name'],
                    onClick: (id) => {openModal({ content: 'userDetails', contentId: id, type: 'dialog' })}
                }
            }
        }
    }

    if (loading) return <Loader/>;

    return <Details
        className={'seethrough-3'}
        style={{padding: '30px'}}
        structure={exampleStructure}
        data={user}
    />;
} 

export default DetailsTest;