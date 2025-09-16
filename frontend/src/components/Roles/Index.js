// FRONTEND/components/Roles/Index.js
import React, { useEffect } from 'react';
import { useModals } from '../../contexts/ModalContext';
import useRole from '../../hooks/useRole';
import Button from '../Button';
import Loader from '../Loader';
import Table from '../Table';

const RolesIndex = () => {
    const { openModal, refreshTriggers } = useModals();
    const { roles, rolesLoading: loading, fetchRoles } = useRole();

    useEffect(() => {
        if (!roles) fetchRoles().then();
    }, [fetchRoles, roles]);

    useEffect(() => {
        if (refreshTriggers?.roles) fetchRoles(false).then();
    }, [fetchRoles, refreshTriggers]);

    const fields = {
        name: {
            display: true,
            type: 'string',
            openModal: 'roleDetails',
            style: {fontSize: 1.25+'rem'}
        },
        users_count: {
            display: true,
            type: 'number',
            formats: {0: 'No users with this role', 1: 'One user with this role', default: '%n users has this role'},
            style: {textAlign: 'right', maxWidth: '200px'},
            computeValue: (data) => data.users?.length || 0
        }
    }

    if (loading) return <Loader />;

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Security Roles </h1>
                <Button
                    className='new-role'
                    onClick={() => openModal({ content: 'roleNew' })}
                    label={'Add role'}
                    icon={'add'}
                />
            </div>
            <Table
                dataSource={roles}
                fields={fields}
                hasHeader={false}
                hasContextMenu={false}
                hasSelectableRows={false}
                descriptions={true}
                descriptionField={'description'}
            />
        </>
    );
};

export default RolesIndex;