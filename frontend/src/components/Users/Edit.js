// FRONTEND/components/Users/Edit.js
import React, {useEffect, useMemo, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import useRole from "../../hooks/useRole";
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import '../../assets/styles/Users.css';
import Dropdown from "../Dropdown";
import Icon from "../Icon";
import Button from "../Button";

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

const UserEdit = ({ userId }) => {
    const { user, loading, error, warning, success, setLoading, fetchUser, saveUser } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { roles, fetchRoles } = useRole();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [ formData, setFormData ] = useState(FORM_CLEAN_STATE);
    const [roleSelections, setRoleSelections] = useState([]);

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
        setRoleSelections(user?.roles?.map((role) => role.id.toString()) || []);
    }, [user]);

    useEffect(() => {
        if (roleSelections.length === 0 && roles?.length > 0) {
            setRoleSelections(['']);
        }
    }, [roleSelections, roles]);

    useEffect(() => {
        if (formData.primary_manager_id && formData.primary_manager_id === formData.secondary_manager_id) {
            setFormData(prev => ({ ...prev, secondary_manager_id: '' }));
        }
    }, [formData.primary_manager_id, formData.secondary_manager_id]);

    useEffect(() => {
        const selectedIds = roleSelections.filter(id => id !== '' && id !== 0).map(id => parseInt(id));
        setFormData(prev => ({ ...prev, role_ids: selectedIds }));
    }, [roleSelections]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setDiscardWarning(true);
    };

    const handleRoleChange = (index, value) => {
        setRoleSelections(prev => {
            const newSel = [...prev];
            newSel[index] = value;
            return newSel;
        });
        setDiscardWarning(true);
    };

    const handleAddRole = () => {
        setRoleSelections(prev => [...prev, '']);
        setDiscardWarning(true);
    };

    const handleRemoveRole = (index) => {
        setRoleSelections(prev => prev.filter((_, i) => i !== index));
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
            }, 10);
            setFormData(FORM_CLEAN_STATE);
        }
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

    const getAvailableRoles = (index) => {
        const currentSelected = roleSelections[index];
        return roles.filter(role => {
            const idStr = role.id.toString();
            return idStr === currentSelected || !roleSelections.includes(idStr);
        });
    };

    const selectedCount = roleSelections.filter(id => id !== '').length;
    const showAddButton = selectedCount < roles?.length;

    console.log(formData.role_ids);

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
                    <div className={'form-label'}>
                        Roles
                    </div>
                    {roles?.length === 0 ? (<p>No roles available.</p>) : (
                        <>
                            <div className={'user-roles'}>
                                {roleSelections.map((selectedId, index) => (
                                    <div key={index} className='role-dropdown-item'>
                                        <Dropdown
                                            name={`role_${index}`}
                                            value={selectedId}
                                            options={getAvailableRoles(index).map(role => ({ id: role.id.toString(), name: role.name }))}
                                            onChange={(e) => handleRoleChange(index, e.target.value)}
                                            placeholder={'Select a role'}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveRole(index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {showAddButton && (
                                <Button
                                    className={'add-button'}
                                    onClick={handleAddRole}
                                    icon={'add_circle_outline'}
                                    label={'Add Role'}
                                    transparent={true}
                                />
                            )}
                        </>
                    )}
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
                        <Icon i={'save'} s={true}/>
                        {userId ? 'Save changes' : 'Create user'}
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