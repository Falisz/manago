// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useState } from 'react';
import {useModals} from "../../contexts/ModalContext";
import useRole from "../../hooks/useRole";
import Loader from '../Loader';
import '../../assets/styles/Users.css';

const RoleEdit = ({ roleId }) => {
    const { role, loading, error, success, setLoading, fetchRole, saveRole } = useRole();
    const { closeTopModal, setDiscardWarning } = useModals();

    const [formData, setFormData] = useState({
        name: '',
        power: '',
        system_default: false,
    });

    useEffect(() => {
        if (!roleId) {
            setFormData({
                name: '',
                power: '',
                system_default: false,
            });
            setLoading(false);
            return;
        }

        fetchRole(roleId).then();
    }, [roleId, setLoading, fetchRole]);

    useEffect(() => {
        setFormData({
            name: role?.name || '',
            power: role?.power || '',
            system_default: role?.system_default || false,
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
            closeTopModal();
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <h1>{roleId ? 'Edit Role' : 'Add New Role'}</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit} className="user-form">
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
                    <label>Power</label>
                    <input
                        type="text"
                        name="power"
                        value={formData.power}
                        onChange={handleChange}
                        placeholder="Enter power level"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="system_default"
                            checked={formData.system_default}
                            onChange={handleChange}
                        />
                        System Default
                    </label>
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