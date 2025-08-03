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
        roleIds: [],
        active: true,
        manager_view_access: false,
    });
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(!!userId);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const rolesResponse = await axios.get('/roles', { withCredentials: true });
                setAvailableRoles(rolesResponse.data || []);

                if (userId) {
                    const userResponse = await axios.get(`/users/${userId}`, { withCredentials: true });
                    const userData = userResponse.data;

                    const userRolesResponse = await axios.get(`/roles/user/${userId}/`, { withCredentials: true });
                    const userRoleIds = userRolesResponse.data.map(role => role.ID);

                    setFormData({
                        login: userData.login || '',
                        email: userData.email || '',
                        password: '',
                        first_name: userData.first_name || '',
                        last_name: userData.last_name || '',
                        roleIds: userRoleIds || [],
                        active: userData.active || false,
                        manager_view_access: userData.manager_view_access || false,
                    });
                } else {
                    setFormData({
                        login: '',
                        email: '',
                        password: '',
                        first_name: '',
                        last_name: '',
                        roleIds: [],
                        active: true,
                        manager_view_access: false,
                    });
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user data. Please try again.');
                setLoading(false);
            }
        };
        fetchData().then();
    }, [userId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'roleIds') {
            const roleId = parseInt(value);
            setFormData(prev => {
                const newRoleIds = checked
                    ? [...prev.roleIds, roleId]
                    : prev.roleIds.filter(id => id !== roleId);
                return { ...prev, roleIds: newRoleIds };
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            let newUserId = userId;
            if (userId) {

                await axios.put(`/users/${userId}`, {
                    login: formData.login,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    active: formData.active,
                    manager_view_access: formData.manager_view_access
                }, { withCredentials: true });

                const roleResponse = await axios.put(`/roles/user/${userId}`, { roleIds: formData.roleIds }, { withCredentials: true });
                setSuccess(roleResponse.data.message);

            } else {

                const userResponse = await axios.post('/users/new', {
                    login: formData.login,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    active: formData.active,
                    manager_view_access: formData.manager_view_access
                }, { withCredentials: true });

                newUserId = userResponse.data.user?.ID;
                if (!newUserId) {
                    setError('User ID not returned from server.');
                    return;
                }

                const roleResponse = await axios.put(`/roles/user/${newUserId}`, { roleIds: formData.roleIds }, { withCredentials: true });
                setSuccess(roleResponse.data.message);
            }
            setTimeout(() => navigate(`/employees/${newUserId || userId}`), 1500);
        } catch (err) {
            console.error('Error saving user or roles:', err);
            setError(err.response?.data?.message || 'Failed to save user or roles. Please try again.');
        } finally {
            onSave();
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
                <div className="form-group">
                    <label>Roles</label>
                    <div className="roles-checklist">
                        {availableRoles.length === 0 ? (
                            <p>No roles available.</p>
                        ) : (
                            availableRoles.map(role => (
                                <label key={role.ID} className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        name="roleIds"
                                        value={role.ID}
                                        checked={formData.roleIds.includes(role.ID)}
                                        onChange={handleChange}
                                    />
                                    {role.name} <span title={"Power"}>&nbsp;({role.power})</span>
                                </label>
                            ))
                        )}
                    </div>
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