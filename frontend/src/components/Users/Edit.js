// FRONTEND/components/Users/Edit.js
import React, {useEffect, useState} from 'react';
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
        first_name: '',
        last_name: '',
        role_ids: [],
        manager_ids: [],
        active: true,
        manager_view_access: false,
};

const UserEdit = ({ userId, preset }) => {
    const { user, loading, error, warning, success, setLoading, fetchUser, saveUser } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { roles, fetchRoles } = useRole();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [ formData, setFormData ] = useState(FORM_CLEAN_STATE);
    const [ roleSelections, setRoleSelections ] = useState([]);
    const [ mgrSelections, setMgrSelections ] = useState([]);

    useEffect(() => {
        fetchRoles().then();
        fetchManagers('managers').then();

        if (!userId) {
            if (preset === 'manager')
                setFormData({ ...FORM_CLEAN_STATE, manager_view_access: true });
            else
                setFormData(FORM_CLEAN_STATE);
            setLoading(false);
            return;
        }

        fetchUser(userId).then();
        setLoading(false);
    }, [userId, preset, setLoading, fetchUser, fetchRoles, fetchManagers]);

    useEffect(() => {
        if (user) {
            setFormData({
                login: user?.login || '',
                email: user?.email || '',
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                role_ids: user?.roles?.map((role) => role.id) || [],
                manager_ids: user?.managers?.map((mgr) => mgr.id) || [],
                active: user?.active || true,
                manager_view_access: user?.manager_view_access || false,
            });
            setRoleSelections(user?.roles?.map((role) => role.id.toString()) || []);
            setMgrSelections(user?.managers?.map((mgr) => mgr.id.toString()) || []);
        }
    }, [user]);

    useEffect(() => {
        if (roleSelections.length === 0 && roles?.length > 0) {
            if (preset === 'manager')
                setRoleSelections(['11']);
            else if (preset === 'employee')
                setRoleSelections(['1']);
            else
                setRoleSelections(['']);
        }
    }, [preset, roleSelections, roles]);

    useEffect(() => {
        if (mgrSelections.length === 0 && managers?.length > 0) {
            setMgrSelections(['']);
        }
    }, [mgrSelections, managers]);

    useEffect(() => {
        const selectedIds = roleSelections.filter(id => id !== '' && id !== 0).map(id => parseInt(id));
        setFormData(prev => ({ ...prev, role_ids: selectedIds }));
    }, [roleSelections]);

    useEffect(() => {
        const selectedIds = mgrSelections?.filter(id => id !== '' && id !== 0).map(id => parseInt(id));
        setFormData(prev => ({ ...prev, manager_ids: selectedIds }));
    }, [mgrSelections]);

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

    const handleManagerChange = (index, value) => {
        setMgrSelections(prev => {
            const newSel = [...prev];
            newSel[index] = value;
            return newSel;
        });
        setDiscardWarning(true);
    };

    const handleAddMgr = () => {
        setMgrSelections(prev => [...prev, '']);
        setDiscardWarning(true);
    };

    const handleRemoveMgr = (index) => {
        setMgrSelections(prev => prev.filter((_, i) => i !== index));
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
                        openModal({ content: 'userDetails', contentId: savedUser.id });
                    }, 350);
                } else {
                    refreshData('user', userId);
                }
                refreshData('users', true);
            }, 10);
            setFormData(FORM_CLEAN_STATE);
        }
    };

    const getAvailableRoles = (index) => {
        const currentSelected = roleSelections[index];
        return roles?.filter(role => {
            const idStr = role.id.toString();
            return idStr === currentSelected || !roleSelections.includes(idStr);
        }) || [];
    };

    const getAvailableManagers = (index) => {
        const currentSelected = mgrSelections[index];
        return managers?.filter(mgr => {
            const idStr = mgr.id.toString();
            return (idStr === currentSelected || !mgrSelections.includes(idStr)) && idStr !== userId?.toString();
        }) || [];
    };

    const showRoleAddButton = roleSelections.filter(id => id !== '').length < roles?.length;
    const showMgrAddButton = mgrSelections.filter(id => id !== '').length < managers?.length;

    console.log(formData);

    if (loading) return <Loader />;

    if (error) return <div className='error-message'>{error}</div>;

    return (
        <>
            <h1>{userId ? 'Edit Employee' : `Add New ${
                preset === 'manager' ? 'Manager' : 
                    preset === 'employee' ? 'Employee' : 'User' }`}</h1>
            {warning && <div className='warning-message'>{warning}</div>}
            {success && <div className='success-message'>{success}</div>}
            <form
                className={'app-form user-edit-form'}
                onSubmit={handleSubmit}
            >
                <div className={'form-section'}>
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
                </div>
                <div className={'form-section'}>
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
                            <div className={'form-section'}>
                                {roleSelections.map((selectedId, index) => (
                                    <div key={index} className='dropdown-item'>
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
                            {showRoleAddButton && (
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
                    <div className={'form-label'}>
                        Managers
                    </div>
                    {managers?.length === 0 ? (<p>No managers available.</p>) : (
                        <>
                            <div className={'form-section'}>
                                {mgrSelections.map((selectedId, index) => (
                                    <div key={index} className='dropdown-item'>
                                        <Dropdown
                                            name={`role_${index}`}
                                            value={selectedId}
                                            options={getAvailableManagers(index).map(mgr => ({ id: mgr.id.toString(), name: mgr.first_name + ' ' + mgr.last_name }))}
                                            onChange={(e) => handleManagerChange(index, e.target.value)}
                                            placeholder={`Select a manager`}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveMgr(index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {showMgrAddButton && (
                                <Button
                                    className={'add-button'}
                                    onClick={handleAddMgr}
                                    icon={'add_circle_outline'}
                                    label={'Add Manager'}
                                    transparent={true}
                                />
                            )}
                        </>
                    )}
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