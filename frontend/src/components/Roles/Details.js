// FRONTEND/components/Roles/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useRole from '../../hooks/useRole';
import { useModals } from '../../contexts/ModalContext';
import '../../assets/styles/Details.css';
import Icon from "../Icon";

const RoleDetails = ({ roleId }) => {
    const { role, loading, fetchRole, deleteRole } = useRole();
    const { openModal, closeTopModal, refreshData, refreshTriggers } = useModals();

    useEffect(() => {
        if (roleId) {
            fetchRole(roleId).then();
        }
    }, [roleId, fetchRole]);

    useEffect(() => {
        if (refreshTriggers?.role?.data === parseInt(roleId)) {
            fetchRole(roleId, true).then();
        }
    }, [roleId, fetchRole, refreshTriggers]);

    const handleDelete = async (users = 0) => {
        let message = 'Are you sure you want to delete this role? This action cannot be undone.'
        if (users > 0) {
            message += ` This role is currently assigned to ${users} user${users > 1 ? 's' : ''}.`
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: () => {
                deleteRole(roleId).then();
                refreshData('roles', true);
                closeTopModal();
            },
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!role) {
        return <h1>Role not found!</h1>;
    }

    return (
        <div className='detail-content'>
            <div className='detail-header'>
                <div className={'detail-title-prefix role-id'} title={'Role ID'}>#{role.id}</div>
                <div className={'detail-title role-name'} title={'Role Name'}>{role.name}</div>
                {!role.system_default? (
                    <>
                        <button
                            className={'action-button edit-button'}
                            type='button'
                            onClick={() => openModal({ content: 'roleEdit', data: { id: role.id } })}
                            title={'Edit Role'}
                        >
                            <Icon i={'edit'} />
                        </button>
                        <button
                            className='action-button delete-button'
                            type='button'
                            onClick={() => handleDelete(role.users?.length)}
                            title={'Delete Role'}
                        >
                            <Icon i={'delete'} />
                        </button>
                    </>
                ) : null}
            </div>
            <div className='detail-section'>
                <div className={'detail-subheader'}>Role details</div>
                <div className={'detail-row role-description'} title={'Role description'}>
                    <label>Description</label> {role.description ?? <div className={'detail-data-placeholder'}>This role has no description.</div>}
                </div>
                {role.system_default ? (
                    <div className='detail-row' title={'Role type'}>
                        <label>Role type</label>
                        <div className='detail-row linear'>
                            <Icon className={'true'} i={'check'}/> This is system default role. You cannot edit nor delete it.
                        </div>
                    </div>
                ) : null}
                </div>
            
            <div className='detail-section'>
                <div className={'detail-subheader'}>Users with this role</div>
                {role.users?.length > 0 ? role.users.map((user) => (
                    <div
                        key={user.id}
                        className={'detail-row linear'}
                    >
                        <span
                            className={'detail-link'}
                            onClick={() => openModal({ content: 'userDetails', data: { id: user.id } })}
                        >
                            {user.first_name} {user.last_name}
                        </span>
                    </div>
                )) :
                <div className={'detail-data-placeholder'}>No users with this role.</div>}
            </div>

        </div>
    );
};

export default RoleDetails;