import React, {useEffect} from 'react';
import EditForm from './EditForm.tsx';
import useUser from '../hooks/useUser';
import useRole from '../hooks/useRole';

const EditTest = () => {
    const { user, fetchUser } = useUser();
    const { roles, fetchRoles} = useRole();

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    useEffect(() => {
        fetchUser(475776).then();
    }, [fetchUser]);

    const exampleStructure = {
        header: {
            type: 'header',
            title: 'Edit User' 
        },
        onSave: {
            type: 'actions',
            saveItem: (a, b) => console.log(a, b),
            refreshTriggers: ['user', 'users'],
            openNew: 'userDetails'
        },
        dataStructure: {
            firstName: {field: 'first_name', type: 'string'},
            lastName: {field: 'last_name', type: 'string'},
            email: {field: 'email', type: 'string'},
            login: {field: 'login', type: 'string'},
            roles: {field: 'roles', type: 'id-list'},  
            managers: {field: 'managers', type: 'id-list'},  
        },
        nameSection: {
            type: 'section',
            firstName: {
                type: 'input',
                dataField: 'first_name',
                label: 'First Name'
            },
            lastName: {
                type: 'input',
                dataField: 'last_name',
                label: 'Last Name'
            }
        },
        credentialsSection: {
            type: 'section',
            email: {
                type: 'input',
                dataField: 'email',
                label: 'Email Address'
            },
            login: {
                type: 'input',
                dataField: 'login',
                label: 'Login Alias'
            }
        },
        statusesSection: {
            type: 'section',
            active: {
                type: 'checkbox',
                dataField: 'active',
                label: 'Active'
            },
            mgrViewAccess: {
                type: 'checkbox',
                dataField: 'login',
                label: 'Manager View Access'
            }
        },
        rolesSection: {
            type: 'section',
            roles: {
                type: 'multi-dropdown',
                dataField: 'roles',
                label: 'Roles',
                itemSource: roles,
                itemNameField: 'name'
            }
        },
        managersSection: {
            type: 'section',
            roles: {
                type: 'multi-dropdown',
                dataField: 'roles',
                label: 'Managers'
            }
        },
        notesSection: {
            type: 'section',
            notes: {
                type: 'textarea',
                dataField: 'notes',
                label: 'Notes'
            }
        }
    };

    return <EditForm
        structure={exampleStructure}
        data={user}
    />;
}
export default EditTest;