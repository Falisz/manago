// FRONTEND/components/Users/Edit.js
import React, {useEffect, useCallback, useMemo} from 'react';
import useRoles from '../../hooks/useRoles';
import useUsers from '../../hooks/useUsers';
import EditForm from '../EditForm';
import Loader from '../Loader';

export const UserAssignment = ({user, resource, modal}) => {
    const {users: managers, loading: managersLoading, fetchUsers: fetchManagers, saveUserAssignment} = useUsers();
    const {roles, loading: rolesLoading, fetchRoles} = useRoles();

    useEffect(() => {
        if (resource === 'manager')
            fetchManagers({group: 'managers'}).then();

        else if (resource === 'role')
            fetchRoles().then();

        else
            console.error('Invalid resource type for UserAssignment: ' + resource);

    }, [resource, fetchManagers, fetchRoles]);

    const loading = useMemo(() =>
            (resource === 'manager' && managersLoading) || (resource === 'role' && rolesLoading),
        [resource, managersLoading, rolesLoading]
    );

    const fields = useMemo(() => {
        if (resource === 'manager')
            return {
                managers: {
                    section: 0,
                    type: 'id-list',
                    inputType: 'multi-dropdown',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemName: 'Manager',
                    itemExcludedIds: {data: [parseInt(user.id)]}
                }
            }

        else if (resource === 'role')
            return {
                roles: {
                    section: 0,
                    type: 'id-list',
                    inputType: 'multi-dropdown',
                    itemSource: roles,
                    itemNameField: 'name',
                    itemName: 'Role',
                }
            }

        else
            return {};

    }, [resource, user.id, managers, roles]);

    const onSubmit = useCallback(async (data) => {
        if (resource === 'manager')
            return await saveUserAssignment({
                userIds: [user.id],
                resource: 'manager',
                resourceIds: data['managers']
            });
        else if (resource === 'role')
            return await saveUserAssignment({
                userIds: [user.id],
                resource: 'role',
                resourceIds: data['roles']
            })
        else
            return null;

    }, [resource, user.id, saveUserAssignment]);

    if (loading) 
        return <Loader/>;

    return <EditForm
        header={`Editing Roles of ${user?.first_name} ${user?.last_name}`}
        fields={fields} 
        onSubmit={onSubmit}
        modal={modal}
        presetData={user} 
    />;
}

export const UserBulkAssignment = ({resource, users, modal}) => {
    const { users: managers, loading: managersLoading, fetchUsers: fetchManagers, saveUserAssignment} = useUsers();
    const { roles, loading: rolesLoading, fetchRoles } = useRoles();

    useEffect(() => {
        if (resource === 'manager')
            fetchManagers({group: 'managers'}).then();

        else if (resource === 'role')
            fetchRoles().then();

        else
            console.error('Invalid resource type for UserAssignment: ' + resource);

    }, [resource, fetchManagers, fetchRoles]);

    const loading = useMemo(() =>
        (resource === 'manager' && managersLoading) || (resource === 'role' && rolesLoading),
        [resource, managersLoading, rolesLoading]
    );

    const header = useCallback((data) => {
        let rsc;

        if (resource === 'manager')
            rsc = 'Manager';
        else if (resource === 'role')
            rsc = 'Role';

        if (!data || !data['mode'])
            return `Bulk ${rsc} Assignment`;

        const headerModes = {
            add: ['Adding', 'to'],
            set: ['Setting', 'to'],
            del: ['Removing', 'from'],
        };
        const tokens = headerModes[data['mode']];
        let title = `%m ${rsc} %m ${users.length} User${users.length > 1 ? 's' : ''}`;
        title = title.replace('%m', tokens[0], 0);
        title = title.replace('%m', tokens[1], 1);
        return title;
    }, [resource, users]);

    const fields = useMemo(() => {
        if (resource === 'manager')
            return {
                users: {
                    section: 0,
                    label: 'Selected Users',
                    nameField: ['first_name', 'last_name'],
                    type: 'listing'
                },
                mode: {
                    section: 1,
                    label: 'Mode',
                    type: 'string',
                    inputType: 'dropdown',
                    options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                    itemName: 'Mode',
                    searchable: false
                },
                manager: {
                    section: 1,
                    label: 'Manager',
                    type: 'manager',
                    inputType: 'dropdown',
                    options: managers?.filter(mgr => !users.find(user => user.id === mgr.id) )
                        .map(mgr => ({id: mgr.id, name: mgr.first_name + ' ' + mgr.last_name})),
                    itemName: 'Manager'
                }
            };

        else if (resource === 'role')
            return {
                users: {
                    section: 0,
                        label: 'Selected Users',
                        nameField: ['first_name', 'last_name'],
                        type: 'listing'
                },
                mode: {
                    section: 1,
                        label: 'Mode',
                        type: 'string',
                        inputType: 'dropdown',
                        options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                        itemName: 'Role',
                        searchable: false
                },
                role: {
                    section: 1,
                        label: 'Role',
                        type: 'number',
                        inputType: 'dropdown',
                        options: roles?.map(role => ({id: role.id, name: role.name})),
                        itemName: 'Role'
                }
            };
    }, [resource, users, managers, roles]);

    const sections = {
        1: {style: {flexDirection: 'row'}}
    };

    const onSubmit = useCallback(async (data) => await saveUserAssignment({
        userIds: users.map(user => user.id),
        resource: resource,
        resourceIds: [data[resource]],
        mode: data.mode
    }), [resource, users, saveUserAssignment]);

    const presetData = useMemo(() => ({mode: 'add', users}), [users]);

    if (loading)
        return <Loader/>;

    return <EditForm 
        header={header}
        fields={fields}
        sections={sections}
        onSubmit={onSubmit}
        modal={modal}
        presetData={presetData}
    />;
}

const UserEdit = ({userId, preset, modal}) => {
    const {user, loading, setLoading, fetchUser, saveUser} = useUsers();
    const {users: managers, fetchUsers} = useUsers();
    const {roles, fetchRoles} = useRoles();

    useEffect(() => {
        fetchRoles().then();
        fetchUsers({group: 'managers'}).then();

        if (userId)
            fetchUser({userId}).then();
        else
            setLoading(false);

    }, [userId, setLoading, fetchUser, fetchRoles, fetchUsers]);

    const fields = useMemo(() => ({
        first_name: {
            section: 0,
            type: 'string',
            inputType: 'input',
            label: 'First Name',
            required: true
        },
        last_name: {
            section: 0,
            label: 'Last Name',
            type: 'string',
            inputType: 'input',
            required: true
        },
        email: {
            section: 1,
            label: 'Email Address',
            type: 'string',
            inputType: 'input',
            required: true
        },
        login: {
            section: 1,
            label: 'Login Alias',
            type: 'string',
            inputType: 'input'
        },
        active: {
            section: 2,
            label: 'Active',
            type: 'boolean',
            inputType: 'checkbox',
            inputLabel: 'Should user be active',
            style: {alignItems: 'flex-start'}
        },
        manager_view_access: {
            section: 2,
            label: 'Manager View Access',
            type: 'boolean',
            inputType: 'checkbox',
            inputLabel: 'Should user has access to the Manager Portal',
            style: {alignItems: 'flex-start'}
        },
        roles: {
            section: 3,
            label: 'Roles',
            type: 'id-list',
            inputType: 'multi-dropdown',
            itemSource: roles,
            itemNameField: 'name',
            itemName: 'Role',
        },
        managers: {
            section: 4,
            label: 'Managers',
            type: 'id-list',
            inputType: 'multi-dropdown',
            itemSource: managers,
            itemNameField: ['first_name', 'last_name'],
            itemName: 'Manager',
            itemExcludedIds: {data: [parseInt(userId)]},
        }
    }), [userId, roles, managers]);

    const presetData = useMemo(() => {
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

    const name = preset === 'manager' ? 'Manager' : preset === 'employee' ? 'Employee' : 'User';

    if (loading) 
        return <Loader/>;

    return <EditForm 
        header={userId ? `Editing ${user?.first_name} ${user?.last_name}` : `Creating new ${name}`}
        fields={fields}
        onSubmit={async (formData) => await saveUser({userId, formData})}
        modal={modal}
        presetData={presetData} 
    />;
};

export default UserEdit;