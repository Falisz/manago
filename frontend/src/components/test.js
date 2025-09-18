import React, {useEffect} from 'react';
import Details from './Details';
import Loader from './Loader';
import useUser from '../hooks/useUser';
import { useModals } from '../contexts/ModalContext';



const DetailsTest = () => {
    const { user, loading, fetchUser } = useUser();
    const { openModal } = useModals();

    useEffect(() => {
        fetchUser(100002).then();
    }, [fetchUser]);

    const exampleStructure = {
        header: {
            type: 'header',
            titlePrefix: {
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
                    onClick: (id) => {}
                },
                delete: {
                    className: 'delete',
                    icon: 'delete',
                    title: 'Delete User',
                    onClick: (id) => {}
                }
            }
        },
        loginDetails: {
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
        roles: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Roles'
            },
            roles: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'roles',
                placeholder: 'No Roles assigned.',
                items: {
                    dataIdField: 'id',
                    dataNameField: 'name',
                    onClick: (id) => {openModal({ content: 'roleDetails', contentId: id, type: 'dialog' })}
                }
            }
        },
        status: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Status',
            },
            isActive: {
                type: 'data-group',
                dataType: 'boolean',
                dataField: 'active',
                trueValue: 'Employee\'s account is active.',
                falseValue: 'Employee\'s account is not active.'
            },
            hasManagerView: {
                type: 'data-group',
                dataType: 'boolean',
                dataField: 'manager_view_access',
                trueValue: 'User has an access to the Manager Portal.',
            }
        },
        managers: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Managers'
            },
            roles: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'managers',
                placeholder: 'No Managers assigned.',
                items: {
                    dataIdField: 'id',
                    dataNameField: 'first_name',
                    onClick: (id) => {openModal({ content: 'userDetails', contentId: id, type: 'dialog' })}
                }
            }
        },
        reportees: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Reportees',
            },
            users: {
                type: 'data-group',
                dataType: 'list',
                dataField: 'managed_users',
                items: {
                    dataIdField: 'id',
                    dataNameField: 'first_name',
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