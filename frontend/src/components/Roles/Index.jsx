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

    const tableStructure = useMemo(() => ({
        pageHeader: {
            title: 'Roles',
            itemName: 'Role',
            newItemModal: 'roleNew'
        },
        tableFields: {
            icon: {
                display: true,
                type: 'icon',
                openModal: 'roleDetails',
                style: {maxWidth: 25+'px', paddingRight: 0, display: 'flex', alignItems: 'center'}
            },
            name: {
                display: true,
                type: 'string',
                openModal: 'roleDetails',
                style: {fontSize: 1.25+'rem', paddingLeft: 0}
            },
            users_count: {
                display: true,
                type: 'number',
                formats: {0: 'No users with this role', 1: 'One user with this role', default: '%n users has this role'},
                style: {textAlign: 'right', maxWidth: '200px'},
                computeValue: (data) => data.users?.length || 0
            }
        },
        descriptionField: 'description'
    }), []);

    if (loading)
        return <Loader />;

    return (
        <Table
            dataSource={roles}
            tableStructure={tableStructure}
            hasSelectableRows={false}
            dataPlaceholder={'No Roles found.'}
            style={{maxWidth: 'max(40%, 500px)'}}
        />
    );
};

export default RolesIndex;