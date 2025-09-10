// FRONTEND/components/Users/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useUser from '../../hooks/useUser';
import { useModals } from '../../contexts/ModalContext';
import '../../assets/styles/Details.css';
import Icon from "../Icon";

const UserDetails = ({ userId }) => {
    const { user, loading, fetchUser, deleteUser } = useUser();
    const { openModal, closeTopModal, refreshData, refreshTriggers } = useModals();

    useEffect(() => {
        if (userId) {
            fetchUser(userId).then();
        }
    }, [userId, fetchUser]);

    useEffect(() => {
        if (refreshTriggers?.user?.data === parseInt(userId)) {
            fetchUser(userId, true).then();
        }
    }, [userId, fetchUser, refreshTriggers]);

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
                deleteUser(userId).then();
                refreshData('users', true);
                closeTopModal();
            },
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <h1>User not found!</h1>;
    }

    return (
        <div className='detail-content'>
            <div className='detail-header'>
                <div className={'detail-title-prefix user-id'} title={'Employee ID'}>#{user.id}</div>
                <div className={'detail-title user-name'} title={'Full Name'}>{user.first_name} {user.last_name}</div>
                <button
                    className={'action-button edit-button'}
                    onClick={() => {openModal({content: 'userEdit', data: { id: user.id}})}}
                    title={'Edit User details'}
                >
                    <Icon i={'edit'} />
                </button>
                <button
                    className={'action-button delete-button'}
                    onClick={handleDelete}
                    title={'Delete the User'}
                >
                    <Icon i={'delete'} />
                </button>
            </div>
            <div className='detail-section'>
                <div className={'detail-subheader'}>Login details</div>
                <div className={'detail-row user-id'} title={'Login ID'}>
                    <label>Login ID</label> {user.id}
                </div>
                <div className={'detail-row user-login'} title={'Login alias'}>
                    <label>Login alias</label> {user.login}
                </div>
                <div className={'detail-row user-email'} title={'Login e-mail'}>
                    <label>Login e-mail</label> {user.email}
                </div>
            </div>

            <div className='detail-section'>
                <div className={'detail-subheader'}>Roles</div>
                {user.roles.length > 0 ? user.roles.map((role) => (
                        <div
                            key={role.id}
                            className={'detail-row'}
                        >
                            <span
                                className={'detail-link'}
                                onClick={() => openModal({ content: 'roleDetails', data: { id: role.id } })}
                            >
                                {role.name}
                            </span>

                        </div>
                    )) :
                    <div className={'detail-data-placeholder'}>Na roles assigned.</div>}
            </div>
            <div className='detail-section'>
                <div className={'detail-subheader'}>Status</div>
                {user.active ?
                    <div className={'detail-row linear'}>
                        <Icon className={'true'} i={'check'}/> Employee's account is active
                    </div> : 
                    <div className={'detail-row linear'}>
                        <Icon className={'false'} i={'close'}/> Employee's account is not active
                    </div> }
                {user.manager_view_access ?
                    <div className={'detail-row linear'}>
                        <Icon className={'true'} i={'check'}/> Employee has access to Manager View
                    </div> : 
                    <div className={'detail-row linear'}>
                        <Icon className={'false'} i={'close'}/> Employee does not have access to Manager View
                    </div> }
            </div>
            <div className='detail-section'>
                <div className={'detail-subheader'}>Reports to</div>
                {user.managers.length > 0 ? user.managers.map((manager) => (
                    <div
                        key={manager.id}
                        className={'detail-row'}
                    >
                        <span
                            className={'detail-link'}
                            onClick={() => openModal({ content: 'userDetails', data: { id: manager.id } })}
                        >
                            {manager.first_name} {manager.last_name}
                        </span>
                    </div>
                )) :
                <div className={'detail-data-placeholder'}>No manager assigned.</div>}
            </div>
            {user.managed_users.length > 0 ? (<div className='detail-section'>
                <div className={'detail-subheader'}>Reportees</div> {user.managed_users.map((user) => (
                    <div
                        key={user.id}
                        className={'detail-row'}
                    >
                        <span
                            className={'detail-link'}
                            onClick={() => openModal({ content: 'userDetails', data: { id: user.id } })}
                        >
                            {user.first_name} {user.last_name}
                        </span>
                    </div>
                ))}</div>)  : null}
        </div>
    );
};

export default UserDetails;