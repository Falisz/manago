import React, {useEffect} from 'react';
import EditForm from './EditForm';
import useUser from '../hooks/useUser';
import useRole from '../hooks/useRole';
import Loader from "./Loader";

const EditTest = () => {
    const { user, fetchUser } = useUser();
    const { usersLoading, users: managers, fetchUsers } = useUser();
    const { rolesLoading, roles, fetchRoles} = useRole();

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
                label: 'First Name',
                required: true
            },
            lastName: {
                section: 0,
                label: 'Last Name',
                field: 'last_name',
                type: 'string',
                inputType: 'input',
                required: true
            },
            email: {
                section: 1,
                label: 'Email Address',
                field: 'email',
                type: 'string',
                inputType: 'input',
                required: true
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
            comboTest: {
                section: 2,
                label: 'Combo Test',
                field: 'combo-test',
                type: 'number',
                inputType: 'combo-dropdown',
                itemSource: roles,
                itemNameField: 'name',
                itemName: 'Role',
                modeField: 'combo-test-mode',
                modeOptions: [{id: 'add', name: 'Add'}, {id: 'remove', name: 'Remove'}]
            }
        },
        sections: {
            2: {style: {flexDirection: 'column'}},
        },
        onSubmit: {
            onSave: (a, b) => console.log(a, b),
            refreshTriggers: [['users', true], (user? ['user', user.id] : null)],
            openIfNew: 'userDetails'
        },
    };

    // const preset = [
    //     {field: 'roles', value: [11]},
    //     {field: 'manager_view_access', value: true}
    // ];
    // const preset = [
    //     {field: 'roles', value: [1]},
    // ]

    if (usersLoading || rolesLoading)
        return <Loader/>

    return <EditForm
        structure={exampleStructure}
        className={'seethrough-3'}
        style={{padding: '20px'}}
    />;
}
export default EditTest;