// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useState } from 'react';
import {useModals} from "../../contexts/ModalContext";
import useRole from "../../hooks/useRole";
import Loader from '../Loader';
import '../../assets/styles/Users.css';

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
        const response = await saveRole(formData, roleId);
        if (response) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!roleId) {
                setTimeout(() => {
                        openModal({ type: 'roleDetails', data: { id: response.id } });
                    }, 350);
                } else {
                    refreshData('role', roleId);
                }
                refreshData('roles', true);
            }, 0);
            
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <h1>{roleId ? 'Edit Role' : 'Add New Role'}</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit} className="role-form">
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter role name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter role description (optional)"
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="save-button">
                        {roleId ? (
                            <>
                                <i className="material-symbols-outlined">save</i> Save Changes
                            </>
                        ) : (
                            <>
                                <i className="material-symbols-outlined">add</i> Create Role
                            </>
                        )}
                    </button>
                    <button type="button" className="cancel-button" onClick={() => closeTopModal()}>
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
};

export default RoleEdit;