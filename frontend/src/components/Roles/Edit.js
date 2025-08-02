import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../Loader';
import '../../assets/styles/Users.css';

const RoleEdit = ({ roleId, onSave }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        power: '',
        system_default: false,
    });
    const [loading, setLoading] = useState(!!roleId);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (roleId) {
            const fetchRole = async () => {
                try {
                    const response = await axios.get(`/roles/${roleId}`, { withCredentials: true });
                    setFormData({
                        name: response.data.name || '',
                        power: response.data.power || '',
                        system_default: response.data.system_default || false,
                    });
                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching role:', err);
                    setError('Failed to load role data. Please try again.');
                    setLoading(false);
                }
            };
            fetchRole().then();
        } else {
            setLoading(false);
        }
    }, [roleId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (roleId) {
                const response = await axios.put(`/roles/${roleId}`, formData, { withCredentials: true });
                setSuccess(response.data.message);
                onSave();
                setTimeout(() => navigate(`/employees/roles/${roleId}`), 1500);
            } else {
                const response = await axios.post('/roles/new', formData, { withCredentials: true });
                setSuccess(response.data.message);
                onSave();
                setTimeout(() => navigate(`/employees/roles`), 1500);
            }
        } catch (err) {
            console.error('Error saving role:', err);
            setError(err.response?.data?.message || 'Failed to save role. Please try again.');
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
                            <><i className={'material-symbols-outlined'}>save</i> Save Changes</>
                        ) : (
                            <><i className={'material-symbols-outlined'}>add</i> Create Role</>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
};

export default RoleEdit;