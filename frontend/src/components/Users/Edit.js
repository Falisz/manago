import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import '../../assets/styles/Users.css';
import useUser from "../../hooks/useUser";
import useRoles from "../../hooks/useRoles";
import useManagers from "../../hooks/useManagers";

const UserEdit = ({ userId, onSave, enableDiscardWarning }) => {
    const {user, loading, error, warning, success, setLoading, fetchUser, saveUser} = useUser();
    const {managers, fetchManagers} = useManagers();
    const {roles, fetchRoles} = useRoles();

    const [formData, setFormData] = useState({
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
    });

    useEffect(() => {
        fetchRoles().then();
        fetchManagers().then();
    }, [fetchRoles, fetchManagers]);

    useEffect(() => {
        if (!userId) {
            setFormData({
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
            });
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
            role_ids: user?.roles?.map((role) => role.ID) || [],
            primary_manager_id: user?.managers?.[0]?.ID || '',
            secondary_manager_id: user?.managers?.[1]?.ID || '',
            active: user?.active || true,
            manager_view_access: user?.manager_view_access || false,
        });
    }, [user]);

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
        enableDiscardWarning();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await saveUser(formData, userId);
        if (response && !userId) {
            onSave(response.ID);
        } else {
            onSave();
        }
        setFormData({
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
        });
    };

    const availableManagers = managers?.filter(manager => parseInt(manager.ID) !== parseInt(userId)) || [];
    const availableSecondaryManagers = availableManagers.filter(
        manager => manager.ID !== parseInt(formData.primary_manager_id)
    );

    if (loading) return <Loader />;

    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <h1>{userId ? 'Edit Employee' : 'Add New Employee'}</h1>
            {warning && <div className="warning-message">{warning}</div>}
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
                    <label>Email address</label>
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
                        {roles?.length === 0 ? (
                            <p>No roles available.</p>
                        ) : (
                            roles?.map(role => (
                                <label key={role.ID} className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        name="roleIds"
                                        value={role.ID}
                                        checked={formData.role_ids.includes(role.ID)}
                                        onChange={handleChange}
                                    />
                                    {role.name} <span title={"Power"}><small>&nbsp;({role.power})</small></span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label>Primary Manager</label>
                    <select
                        name="primary_manager_id"
                        value={formData.primary_manager_id}
                        onChange={handleChange}
                        className="manager-select"
                    >
                        <option value="" hidden>Select a manager</option>
                        <option value="0">None</option>
                        {availableManagers.map(manager => (
                            <option key={manager.ID} value={parseInt(manager.ID)}>
                                {manager.first_name} {manager.last_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Secondary Manager</label>
                    <select
                        name="secondary_manager_id"
                        value={formData.secondary_manager_id}
                        onChange={handleChange}
                        className="manager-select"
                    >
                        <option value="" hidden>Select a manager</option>
                        <option value="0">None</option>
                        {availableSecondaryManagers.map(manager => (
                            <option key={manager.ID} value={parseInt(manager.ID)}>
                                {manager.first_name} {manager.last_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="save-button">
                        {userId ? (
                            <><i className={'material-symbols-outlined'}>save</i>Save changes</>
                        ) : (
                            <><i className={'material-symbols-outlined'}>add</i>Add a new employee</>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
};

export default UserEdit;