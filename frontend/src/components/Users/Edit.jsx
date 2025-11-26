// FRONTEND/components/Users/Edit.js
import React, {useEffect, useCallback, useMemo} from 'react';
import {useUsers, useRoles} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

export const UserAssignment = ({user, resource, modal}) => {
    const {users: managers, loading: managersLoading, fetchUsers: fetchManagers, saveUserAssignment} = useUsers();
    const {roles, loading: rolesLoading, fetchRoles} = useRoles();

    React.useEffect(() => {
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

        const batchMode = Array.isArray(user);

        if (batchMode) {
            if (!data || !data['mode'])
                return `Bulk ${rsc} Assignment`;

            const headerModes = {
                add: ['Adding', 'to'],
                set: ['Setting', 'to'],
                del: ['Removing', 'from'],
            };
            const tokens = headerModes[data['mode']];
            let title = `%m1 ${rsc} %m2 ${user.length} User${user.length > 1 ? 's' : ''}`;
            title = title.replace('%m1', tokens[0]);
            title = title.replace('%m2', tokens[1]);
            return title;
        } else {
            return `Editing ${rsc}s of ${user?.first_name} ${user?.last_name}`;
        }
    }, [user, resource]);

    const fields = useMemo(() => {
        const batchMode = Array.isArray(user);

        if (!batchMode && resource === 'manager')
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

        else if (!batchMode && resource === 'role')
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

        else if (batchMode && resource === 'manager')
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
                    options: managers?.filter(mgr => !user.find(user => user.id === mgr.id) )
                        .map(mgr => ({id: mgr.id, name: mgr.first_name + ' ' + mgr.last_name})),
                    itemName: 'Manager'
                }
            };

        else if (batchMode && resource === 'role')
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

        else
            return {};

    }, [user, resource, managers, roles]);

    const sections = {
        1: {style: {flexDirection: 'row'}}
    };

    const onSubmit = useCallback(async (data) => {
        const batchMode = Array.isArray(user);

        if (!batchMode && resource === 'manager')
            return await saveUserAssignment({
                userIds: [user.id],
                resource,
                resourceIds: data['managers']
            });
        else if (!batchMode && resource === 'role')
            return await saveUserAssignment({
                userIds: [user.id],
                resource,
                resourceIds: data['roles']
            })
        else if (batchMode)
            return await saveUserAssignment({
                userIds: user.map(u => u.id),
                resource,
                resourceIds: [data[resource]],
                mode: data.mode
            });
        else
            return null;

    }, [user, resource, saveUserAssignment]);

    const presetData = useMemo(() => (Array.isArray(user) ? {mode: 'add', users: user} : user), [user]);

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
            fetchUser({id: userId}).then();
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
            inputType: 'input',
            required: true
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
        onSubmit={async (data) => await saveUser({userId, data})}
        modal={modal}
        presetData={presetData} 
    />;
};

export default UserEdit;