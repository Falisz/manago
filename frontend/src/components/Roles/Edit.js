// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useState } from 'react';
import {useModals} from '../../contexts/ModalContext';
import useRole from '../../hooks/useRole';
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import Icon from "../Icon";

const FORM_CLEAN_STATE = {
        name: '',
        description: ''
    };

const RoleEdit = ({ roleId }) => {
    const { role, loading, error, success, setLoading, fetchRole, saveRole } = useRole();
    const { closeTopModal, setDiscardWarning, refreshData } = useModals();
    const { openModal } = useModals();
    const [formData, setFormData] = useState(FORM_CLEAN_STATE);

    useEffect(() => {
        if (!roleId) {
            setFormData(FORM_CLEAN_STATE);
            setLoading(false);
            return;
        }
        fetchRole(roleId).then();
    }, [roleId, setLoading, fetchRole]);

    useEffect(() => {
        setFormData({
            name: role?.name || '',
            description: role?.description || '',
        });
    }, [role]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedRole = await saveRole(formData, roleId);
        if (savedRole) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!roleId) {
                setTimeout(() => {
                        openModal({ content: 'roleDetails', contentId: savedRole.id, type: 'dialog'});
                    }, 350);
                } else {
                    refreshData('role', roleId);
                }
                refreshData('roles', true);
            }, 10);
            setFormData(FORM_CLEAN_STATE);
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <h1>{roleId ? 'Edit Role' : 'Add New Role'}</h1>
            {error && <div className='error-message'>{error}</div>}
            {success && <div className='success-message'>{success}</div>}
            <form onSubmit={handleSubmit} className='app-form'>
                <div className='form-group'>
                    <label className={'form-label'}>Name</label>
                    <input
                        className={'form-input'}
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Enter role name'
                        required
                    />
                </div>
                <div className='form-group'>
                    <label className={'form-label'}>Description</label>
                    <textarea
                        className={'form-textarea'}
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        placeholder='Enter role description (optional)'
                    />
                </div>
                <div className='form-actions'>
                    <button type='submit' className='action-button submit-button'>
                        <Icon i={'save'} s={true}/>
                        {roleId ? 'Save changes' : 'Create role'}
                    </button>
                    <button type='button' className='action-button discard-button' onClick={() => closeTopModal()}>
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
};

export default RoleEdit;