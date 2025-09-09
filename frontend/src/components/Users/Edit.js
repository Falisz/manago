// FRONTEND/components/Users/Edit.js
import React, {useEffect, useMemo, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import useRole from "../../hooks/useRole";
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import '../../assets/styles/Users.css';
import Dropdown from "../Dropdown";

const FORM_CLEAN_STATE = {
        login: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_ids: [],
        primary_manager_id: '',
        secondary_manager_id: '',
        active: true,
        manager_view_access: false,
};

// TODO: Rewrite the roles assignment logic and interface.
//  Instead of checkboxes - one dropdown menu, with a button to add next ones with other roles to assign.

const UserEdit = ({ userId }) => {
    const { user, loading, error, warning, success, setLoading, fetchUser, saveUser } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { roles, fetchRoles } = useRole();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [formData, setFormData] = useState(FORM_CLEAN_STATE);

    useEffect(() => {
        fetchRoles().then();
        fetchManagers('managers').then();
    }, [fetchRoles, fetchManagers]);

    useEffect(() => {
        if (!userId) {
            setFormData(FORM_CLEAN_STATE);
            setLoading(false);
            return;
        }

        fetchUser(userId).then();
    }, [userId, setLoading, fetchUser]);

    useEffect(() => {
        setFormData({
            login: user?.login || '',
            email: user?.email || '',
            password: user?.password || '',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            role_ids: user?.roles?.map((role) => role.id) || [],
            primary_manager_id: user?.managers?.[0]?.id || '',
            secondary_manager_id: user?.managers?.[1]?.id || '',
            active: user?.active || true,
            manager_view_access: user?.manager_view_access || false,
        });
    }, [user]);

    useEffect(() => {
        if (formData.primary_manager_id && formData.primary_manager_id === formData.secondary_manager_id) {
            setFormData(prev => ({ ...prev, secondary_manager_id: '' }));
        }
    }, [formData.primary_manager_id, formData.secondary_manager_id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'roleIds') {
            const roleId = parseInt(value);
            setFormData(prev => {
                const newRoleIds = checked ? [...prev.role_ids, roleId] : prev.role_ids.filter(id => id !== roleId);
                return { ...prev, role_ids: newRoleIds };
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedUser = await saveUser(formData, userId);
        if (savedUser) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!userId) {
                    setTimeout(() => {
                        openModal({ content: 'userDetails', data: { id: savedUser.id } });
                    }, 350);
                } else {
                    refreshData('user', userId);
                }
                refreshData('users', true);
            }, 0);
        }
        setFormData(FORM_CLEAN_STATE);
    };

    const availableManagers = useMemo(() => {
        return managers?.filter(
            manager => parseInt(manager.id) !== parseInt(userId)
        ).map(manager => ({
            id: manager.id,
            name: `${manager.first_name} ${manager.last_name}`
        })) || [];
    }, [managers, userId]);

    const availableSecondaryManagers = useMemo(() => {
        return availableManagers.filter(
            manager => manager.id !== formData.primary_manager_id
        );
    }, [availableManagers, formData.primary_manager_id]);

    if (loading) return <Loader />;

    if (error) return <div className='error-message'>{error}</div>;

    return (
        <>
            <h1>{userId ? 'Edit Employee' : 'Add New Employee'}</h1>
            {warning && <div className='warning-message'>{warning}</div>}
            {success && <div className='success-message'>{success}</div>}
            <form
                className={'app-form user-edit-form'}
                onSubmit={handleSubmit}
            >
                <div className='form-group'>
                    <label className={'form-label'}>
                        Login
                    </label>
                    <input
                        className={'form-input'}
                        type='text'
                        name='login'
                        value={formData.login}
                        onChange={handleChange}
                        placeholder='Enter login (optional)'
                    />
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        Email address
                    </label>
                    <input
                        className={'form-input'}
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='Enter email'
                        required
                    />
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        First Name
                    </label>
                    <input
                        className={'form-input'}
                        type='text'
                        name='first_name'
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder='Enter first name'
                        required
                    />
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        Last Name
                    </label>
                    <input
                        className={'form-input'}
                        type='text'
                        name='last_name'
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder='Enter last name'
                        required
                    />
                </div>
                <div className='form-group'>
                    <label>
                        <input
                            type='checkbox'
                            name='active'
                            checked={formData.active}
                            onChange={handleChange}
                        />
                        Active
                    </label>
                </div>
                <div className='form-group'>
                    <label>
                        <input
                            type='checkbox'
                            name='manager_view_access'
                            checked={formData.manager_view_access}
                            onChange={handleChange}
                        />
                        Manager View Access
                    </label>
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        Roles
                    </label>
                    <div className='roles-checklist'>
                        {roles?.length === 0 ? (
                            <p>No roles available.</p>
                        ) : (
                            roles?.map(role => (
                                <label key={role.id} className='role-checkbox'>
                                    <input
                                        type='checkbox'
                                        name='roleIds'
                                        value={role.id}
                                        checked={formData.role_ids.includes(role.id)}
                                        onChange={handleChange}
                                    />
                                    {role.name}
                                </label>
                            ))
                        )}
                    </div>
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        Primary Manager
                    </label>
                    <Dropdown
                        name="primary_manager_id"
                        value={formData.primary_manager_id}
                        options={availableManagers}
                        onChange={handleChange}
                        placeholder={'Select a primary manager'}
                        noneAllowed={true}
                    />
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>
                        Secondary Manager
                    </label>
                    <Dropdown
                        name="secondary_manager_id"
                        value={formData.secondary_manager_id}
                        options={availableSecondaryManagers}
                        onChange={handleChange}
                        placeholder={'Select a secondary manager'}
                        noneAllowed={true}
                    />
                </div>
                <div className='form-actions'>
                    <button type='submit' className='action-button submit-button'>
                        {userId ? (
                            <><i className={'material-symbols-outlined'}>save</i>Save changes</>
                        ) : (
                            <><i className={'material-symbols-outlined'}>add</i>Add a new employee</>
                        )}
                    </button>
                    <button type='button' className='action-button discard-button' onClick={() => closeTopModal()}>
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
};

export default UserEdit;