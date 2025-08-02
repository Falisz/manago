import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../Loader';
import '../../assets/styles/Users.css';

const UserEdit = ({ userId, onSave }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        login: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 0,
        active: true,
        manager_view_access: false,
    });
    const [loading, setLoading] = useState(!!userId);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (userId) {
            const fetchUser = async () => {
                try {
                    const response = await axios.get(`/users/${userId}`, { withCredentials: true });
                    setFormData({
                        login: response.data.login || '',
                        email: response.data.email || '',
                        password: '',
                        first_name: response.data.first_name || '',
                        last_name: response.data.last_name || '',
                        role: response.data.role || 0,
                        active: response.data.active || false,
                        manager_view_access: response.data.manager_view_access || false,
                    });
                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching user:', err);
                    setError('Failed to load user data. Please try again.');
                    setLoading(false);
                }
            };
            fetchUser().then();
        } else {
            setLoading(false);
        }
    }, [userId]);

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
            if (userId) {
                const response = await axios.put(`/users/${userId}`, formData, { withCredentials: true });
                setSuccess(response.data.message);
                onSave();
                setTimeout(() => navigate(`/employees/${userId}`), 1500);
            } else {
                const response = await axios.post('/users/new', formData, { withCredentials: true });
                setSuccess(response.data.message);
                onSave();
                setTimeout(() => navigate(`/employees/${userId}`), 1500);
            }
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.message || 'Failed to save user. Please try again.');
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <h1>{userId ? 'Edit Employee' : 'Add New Employee'}</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                    <label>Login</label>
                    <input
                        type="text"
                        name="login"
                        value={formData.login}
                        onChange={handleChange}
                        placeholder="Enter login (optional)"
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={userId ? 'Enter new password (optional)' : 'Enter password'}
                        required={!userId}
                    />
                </div>
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                        />
                        Active
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="manager_view_access"
                            checked={formData.manager_view_access}
                            onChange={handleChange}
                        />
                        Manager View Access
                    </label>
                </div>
                <div className="form-actions">
                    <button type="submit" className="save-button">
                        {userId ? (
                            <><i className={'material-symbols-outlined'}>save</i> Save changes</>
                        ) : (
                            <><i className={'material-symbols-outlined'}>add</i>Create Employee</>
                        )
                        }
                    </button>
                </div>
            </form>
        </>
    );
};

export default UserEdit;