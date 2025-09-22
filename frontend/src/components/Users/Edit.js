// FRONTEND/components/Users/Edit.js
import React, {useEffect, useMemo} from 'react';
import useUser from '../../hooks/useUser';
import useRole from '../../hooks/useRole';
import Loader from '../Loader';
import EditForm from '../EditForm';

export const UserRoleAssignment = ({user}) => {
    const {saveUserAssignment} = useUser();
    const {roles, rolesLoading: loading, fetchRoles} = useRole();

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    const formStructure = useMemo(() => ({
        header: {
            title: `Editing Roles of ${user?.first_name} ${user?.last_name}`,
        },
        inputs: {
            roles: {
                section: 0,
                field: 'roles',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: roles,
                itemNameField: 'name',
                itemName: 'Role',
            }
        },
        onSubmit: {
            onSave: (data) => saveUserAssignment('roles', data, [user.id]),
            refreshTriggers: [['users', true], ['user', user.id]]
        }
    }), [user, roles, saveUserAssignment]);

    if (loading) return <Loader/>;

    return <EditForm
        structure={formStructure}
        presetData={user}
    />;
}

export const UserManagerAssignment = ({user}) => {
    const {users: managers, usersLoading: loading, fetchUsers, saveUserAssignment} = useUser();

    useEffect(() => {
        fetchUsers('managers').then();
    }, [fetchUsers]);

    const formStructure = useMemo(() => ({
        header: {
            title: `Editing Managers of ${user?.first_name} ${user?.last_name}`,
        },
        inputs: {
            roles: {
                section: 0,
                field: 'managers',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemName: 'Manager',
            }
        },
        onSubmit: {
            onSave: (data) => saveUserAssignment('managers', data, [user.id]),
            refreshTriggers: [['users', true], ['user', user.id]]
        }
    }), [user, managers, saveUserAssignment]);

    if (loading) return <Loader/>;

    return <EditForm
        structure={formStructure}
        presetData={user}
    />;
}

export const UserRoleBulkAssignment = ({users}) => {
    const { saveUserAssignment } = useUser();
    const { roles, rolesLoading: loading, fetchRoles } = useRole();

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    const formStructure = useMemo(() => ({
        header: {
            title: `%m Role %m ${users.length} User${users.length > 1 ? 's' : ''}`,
            modes: true
        },
        inputs: {
            selectedUsers: {
                section: 0,
                label: 'Selected Users',
                field: 'users',
                nameField: ['first_name', 'last_name'],
                type: 'listing'
            },
            mode: {
                section: 1,
                label: 'Mode',
                field: 'mode',
                type: 'string',
                inputType: 'dropdown',
                options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                itemName: 'Role',
                searchable: false
            },
            role: {
                section: 1,
                label: 'Role',
                field: 'role',
                type: 'number',
                inputType: 'dropdown',
                options: roles?.map(role => ({id: role.id, name: role.name})),
                itemName: 'Role'
            }
        },
        sections: {
            1: {style: {flexDirection: 'row'}}
        },
        onSubmit: {
            onSave: (data) => saveUserAssignment(
                'roles',
                [data.role],
                users.map(user => user.id),
                data.mode
            ),
            refreshTriggers: [['users', true]]
        }
    }), [users, roles, saveUserAssignment]);

    const presetData = useMemo(() => ({mode: 'add', users}), [users]);

    if (loading) return <Loader/>;

    return <EditForm
        structure={formStructure}
        presetData={presetData}
    />;
}

export const UserManagerBulkAssignment = ({users}) => {
    const {users: managers, usersLoading: loading, fetchUsers, saveUserAssignment} = useUser();

    useEffect(() => {
        fetchUsers('managers').then();
    }, [fetchUsers]);

    const formStructure = useMemo(() => ({
        header: {
            title: `%m Manager %m ${users.length} User${users.length > 1 ? 's' : ''}`,
            modes: true
        },
        inputs: {
            selectedUsers: {
                section: 0,
                label: 'Selected Users',
                field: 'users',
                nameField: ['first_name', 'last_name'],
                type: 'listing'
            },
            mode: {
                section: 1,
                label: 'Mode',
                field: 'mode',
                type: 'string',
                inputType: 'dropdown',
                options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                itemName: 'Mode',
                searchable: false
            },
            manager: {
                section: 1,
                label: 'Manager',
                field: 'manager',
                type: 'manager',
                inputType: 'dropdown',
                options: managers?.filter(mgr => !users.find(user => user.id === mgr.id) )
                    .map(mgr => ({id: mgr.id, name: mgr.first_name + ' ' + mgr.last_name})),
                itemName: 'Manager'
            }
        },
        sections: {
            1: {style: {flexDirection: 'row'}}
        },
        onSubmit: {
            onSave: (data) => saveUserAssignment(
                'managers',
                [data.manager],
                users.map(user => user.id),
                data.mode
            ),
            refreshTriggers: [['users', true]]
        }
    }), [users, managers, saveUserAssignment]);

    const presetData = useMemo(() => ({mode: 'add', users}), [users]);

    if (loading) return <Loader/>;

    return <EditForm
        structure={formStructure}
        presetData={presetData}
    />;
}

const UserEdit = ({userId, preset}) => {
    const {user, loading, setLoading, error, fetchUser, saveUser} = useUser();
    const {users: managers, fetchUsers} = useUser();
    const {roles, fetchRoles} = useRole();

    useEffect(() => {
        fetchRoles().then();
        fetchUsers('managers').then();
        if (userId) {
            fetchUser(userId).then();
        } else {
            setLoading(false);
        }
    }, [userId, setLoading, fetchUser, fetchRoles, fetchUsers]);

    let name = preset === 'manager' ? 'Manager' : preset === 'employee' ? 'Employee' : 'User';

    const userData = useMemo(() => {
        const baseData = user ? user : {};
        return {
            ...baseData,
            ...(preset === 'manager' ? {
                roles: [11],
                manager_view_access: true
            } : preset === 'employee' ? {
                roles: [1]
            } : {})
        };
    }, [user, preset]);

    const formStructure = useMemo(() => ({
        header: {
            title: userId ? `Editing ${user?.first_name} ${user?.last_name}` : `Creating new ${name}`,
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
                section: 3,
                label: 'Roles',
                field: 'roles',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: roles,
                itemNameField: 'name',
                itemName: 'Role',
            },
            managers: {
                section: 4,
                label: 'Managers',
                field: 'managers',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemName: 'Manager',
            }
        },
        onSubmit: {
            onSave: (data, id) => saveUser(data, id),
            refreshTriggers: [['users', true], ...(user ? [['user', user.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [name, saveUser, user, userId, roles, managers]);

    if (loading) return <Loader/>;

    if (error) return <div className='error-message'>{error}</div>;

    return (
        <EditForm
            structure={formStructure}
            presetData={userData}
        />
    );
};

export default UserEdit;