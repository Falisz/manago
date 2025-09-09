// FRONTEND/components/Roles/Index.js
import React, { useEffect } from 'react';
import { useModals } from '../../contexts/ModalContext';
import '../../assets/styles/Roles.css';
import '../../assets/styles/List.css';
import Button from '../Button';
import Loader from '../Loader';
import useRole from "../../hooks/useRole";

const RolesList = () => {
    const { openModal, refreshTriggers } = useModals();
    const { roles, rolesLoading, fetchRoles } = useRole();

    const openRoleDetails = (id) => {
        openModal({
            content: 'roleDetails',
            type: 'dialog',
            data: { id }
        });
    };

    useEffect(() => {
        if (!roles) fetchRoles().then();
    }, [fetchRoles, roles]);

    useEffect(() => {
        if (refreshTriggers?.roles) fetchRoles(false).then();
    }, [fetchRoles, refreshTriggers]);

    if (rolesLoading) return <Loader />;
    
    return (
        <div className='app-list roles-list seethrough app-scroll app-overflow-y'>
            {roles === null || roles?.length === 0 ? (
                <p>No roles found.</p>
            ) : (
                roles?.map((role) => (
                    <div
                        className='app-list-row-big app-clickable'
                        key={role.id}
                        onClick={() => openRoleDetails(role.id)}
                    >
                        <div className='app-list-row-content'>
                            <div className='app-list-row-cell role-title'>{role.name}</div>
                            <div className='app-list-row-cell role-users'>{role.users?.length > 0 ? role.users.length + ' users with this role.' : <i>No users with this role.</i>}</div>
                        </div>
                        {role.description && <div className='app-list-row-content'>
                            <div className={'app-list-row-cell role-description'}>
                                {role.description}
                            </div>
                        </div>}
                    </div>
                ))
            )}
        </div>
    );
};

const RolesIndex = () => {
    const { openModal } = useModals();

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Security Roles </h1>
                <Button
                    className='new-role-button'
                    onClick={() => openModal({ content: 'roleNew' })}
                    label={'Add role'}
                    icon={'add'}
                />
            </div>
            <RolesList/>
        </>
    );
};

export default RolesIndex;