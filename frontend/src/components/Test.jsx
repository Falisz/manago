import React, {useEffect} from 'react';
import EditForm from './EditForm';
import useUser from '../hooks/useUser';
import useRole from '../hooks/useRole';

const EditTest = () => {
    const { user, fetchUser } = useUser();
    const { users: managers, fetchUsers } = useUser();
    const { roles, fetchRoles} = useRole();

    useEffect(() => {
        fetchRoles().then();
        fetchUsers('managers').then();
    }, [fetchRoles, fetchUsers]);

    useEffect(() => {
        fetchUser(100012).then();
    }, [fetchUser]);

    const exampleStructure = {
        header: {
            title: 'Edit User'
        },
        inputs: {
            firstName: {
                section: 0,
                field: 'first_name',
                type: 'string',
                inputType: 'input',
                label: 'First Name'
            },
            lastName: {
                section: 0,
                label: 'Last Name',
                field: 'last_name',
                type: 'string',
                inputType: 'input'
            },
            email: {
                section: 1,
                label: 'Email Address',
                field: 'email',
                type: 'string',
                inputType: 'input'
            },
            login: {
                section: 1,
                label: 'Login Alias',
                field: 'login',
                type: 'string',
                inputType: 'input'
            },
            active: {
                section: 2,
                label: 'Active',
                field: 'active',
                type: 'boolean',
                inputType: 'checkbox',
                inputLabel: 'Should user be active',
                style: {alignItems: 'flex-start'}
            },
            mgrViewAccess: {
                section: 2,
                label: 'Manager View Access',
                field: 'manager_view_access',
                type: 'boolean',
                inputType: 'checkbox',
                inputLabel: 'Should user has access to the Manager Portal',
                style: {alignItems: 'flex-start'}
            },
            roles: {
                section: 2,
                label: 'Roles',
                field: 'roles',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: roles,
                itemNameField: 'name',
                itemName: 'Role',
            },
            managers: {
                section: 2,
                label: 'Managers',
                field: 'managers',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemName: 'Manager',
            },
            notes: {
                section: 2,
                label: 'Notes',
                field: 'notes',
                type: 'string',
                inputType: 'textarea',
            },
        },
        sections: {
            2: {style: {flexDirection: 'column'}},
        },
        onSave: {
            saveItem: (a, b) => console.log(a, b),
            refreshTriggers: ['user', 'users'],
            openNew: 'userDetails'
        },
    };

    return <EditForm
        structure={exampleStructure}
        data={user}
        className={'seethrough-3'}
        style={{padding: '20px'}}
    />;
}
export default EditTest;