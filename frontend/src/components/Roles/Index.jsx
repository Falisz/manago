// FRONTEND/components/Roles/Index.js
import React, { useEffect, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import useRoles from '../../hooks/useRoles';
import Loader from '../Loader';
import Table from '../Table';

const RolesIndex = () => {
    const { refreshTriggers } = useApp();
    const { roles, loading, fetchRoles } = useRoles();

    useEffect(() => {
        const refresh = refreshTriggers?.roles || false;
        
        if (refresh)
            delete refreshTriggers.roles;

        if (!roles || refresh)
            fetchRoles({all: true, loading: true}).then();

    }, [fetchRoles, roles, refreshTriggers.roles]);

    const header = useMemo(() => ({
        title: 'Roles',
        itemName: 'Role',
        newItemModal: 'roleNew'
    }), []);

    const fields = useMemo(() => ({
        0: {
            name: 'icon',
            type: 'icon',
            openModal: 'roleDetails',
            style: {maxWidth: '25px', paddingRight: 0, display: 'flex', alignItems: 'center'}
        },
        1: {
            name: 'name',
            type: 'string',
            openModal: 'roleDetails',
            style: {fontSize: '1.25rem', paddingLeft: 0}
        },
        2: {
            name: 'users',
            type: 'number',
            value: (data) => data.users?.length || 0,
            formats: {
                0: 'No users with this role',
                1: 'One user with this role',
                default: '%n users has this role'
            },
            style: {textAlign: 'right', maxWidth: '200px'}
        }
    }), []);

    if (loading)
        return <Loader />;

    return (
        <Table
            data={roles}
            header={header}
            fields={fields}
            descriptionFields={'description'}
            dataPlaceholder={'No Roles found.'}
            style={{maxWidth: 'max(40%, 500px)'}}
        />
    );
};

export default RolesIndex;