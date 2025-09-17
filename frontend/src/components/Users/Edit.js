// FRONTEND/components/Users/Edit.js
import React, {useEffect, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import useRole from '../../hooks/useRole';
import Loader from '../Loader';
import Dropdown from '../Dropdown';
import Button from '../Button';
import '../../assets/styles/Form.css';

const FORM_CLEAN_STATE = {
    login: '',
    email: '',
    first_name: '',
    last_name: '',
    role_ids: [null],
    manager_ids: [null],
    active: true,
    manager_view_access: false
};

export const UserRoleAssignment = ({users}) => {
    const { closeTopModal } = useModals();
    const { roles, rolesLoading: loading, fetchRoles } = useRole();
    const [ formData, setFormData ] = useState({mode: 'add', roleId: null});

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    const handleChange = (e) => {
        const { value, name } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = () => {
        console.warn('User Role assignment feature not implemented yet.');
        closeTopModal();
    }

    if (loading) return <Loader/>;

    return <>
            <h1>
                { users.length > 1 ?
                `Assigning Role to ${users.length} Users` :
                `Editing Roles of ${users[0].first_name + ' ' + users[0].last_name}` }
            </h1>
            <div className='app-form' style={{minHeight: '100px', padding: '0 0 150px'}}>
                { users.length > 1 ? <>
                    <h2 className={'form-header'}>Selected User</h2>
                    <div>
                        { users?.map( (user, index) =>
                            (user.first_name + ' ' + user.last_name + (index !== users.length - 1  ?  ', ' : '')) )
                        }
                    </div>
                </> : null
                }
                <h2 className={'form-header'}>Role</h2>
                <div className='form-section'>
                    <Dropdown
                        name={'mode'}
                        value={formData.mode}
                        options={[{id: 'add', name: 'Add'}, {id: 'remove', name: 'Remove'}]}
                        onChange={handleChange}
                        placeholder={`Select mode`}
                        searchable={false}
                        style={{width: '100px', minWidth: 'unset'}}
                    />
                    <Dropdown
                        name={'roleId'}
                        value={formData.roleId}
                        options={roles?.map(role => ({
                            id: role.id,
                            name: role.name
                        }))}
                        onChange={handleChange}
                        placeholder={`Select role`}
                    />
                </div>
                <div className='form-section align-center'>
                    <Button
                        className={'save-button'}
                        label={'Assign Role'}
                        icon={'save'}
                        onClick={handleSubmit}
                    />
                    <Button
                        className={'discard-button'}
                        type={'button'}
                        label={'Discard'}
                        icon={'close'}
                        onClick={closeTopModal}
                    />
                </div>
            </div>
        </>
    
};

const UserEdit = ({ userId, preset }) => {
    const { loading, error, warning, success, setLoading, fetchUser, saveUser } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { roles, fetchRoles } = useRole();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [ formData, setFormData ] = useState(FORM_CLEAN_STATE);

    useEffect(() => {
        fetchRoles().then();
        fetchManagers('managers').then();

        if (!userId) {
            if (preset === 'manager') {
                setFormData({
                    ...FORM_CLEAN_STATE,
                    role_ids: [11],
                    manager_view_access: true
                });
            } else if (preset === 'employee') {
                setFormData({
                    ...FORM_CLEAN_STATE,
                    role_ids: [1]
                });
            } else
                setFormData(FORM_CLEAN_STATE);
            setLoading(false);
            return;
        }

        fetchUser(userId).then(user => {
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
        });
        
    }, [userId, preset, setLoading, fetchUser, fetchRoles, fetchManagers]);

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        if (['role_ids', 'manager_ids'].includes(name)) {
            setFormData(prev => ({
                ...prev,
                [name]: [
                    ...prev[name].slice(0, index),
                    parseInt(value) || null,
                    ...prev[name].slice(index + 1),
                ],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        setDiscardWarning(true);
    };

    const handleAddItem = (field) => {
        if (!['role_ids', 'manager_ids'].includes(field)) return;

        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], null],
        }))
    }

    const handleRemoveItem = (field, index) => {
        if (!['role_ids', 'manager_ids'].includes(field)) return;

        if (index !== 0)
            setFormData(prev => ({
                ...prev,
                [field]: prev[field].filter((_, i) => i !== index),
            }));
        else
            setFormData(prev => ({
                ...prev,
                [field]: [
                    null,
                    ...prev[field].slice(1)
                ]
            }));
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

    const getSelectableItems = (index, dropdownName) => {
        if (!['role_ids', 'manager_ids'].includes(dropdownName)) {
            console.warn(`Invalid dropdownName: ${dropdownName}`);
            return [];
        }
        const currentSelected = formData[dropdownName] && formData[dropdownName][index];

        if (dropdownName === 'manager_ids') {
            return managers?.filter(
                manager => (
                    (manager.id === currentSelected || !formData.manager_ids.includes(manager.id)) &&
                    manager.id !== userId
                )
            ) || [];
        } else if (dropdownName === 'role_ids') {
            return roles?.filter(
                role => (role.id === currentSelected || !formData.role_ids.includes(role.id))
            ) || [];
        }

        return [];
    }

    const addNewItem = (dropdownName) => {
        if (!['role_ids', 'manager_ids'].includes(dropdownName)) {
            console.warn(`Invalid dropdownName: ${dropdownName}`);
            return false;
        }
        const source = dropdownName === 'manager_ids' ? managers : roles;

        if (!source) return false;

        return !formData[dropdownName].includes(null) && formData[dropdownName].length < source.length;
    };

    const MultiDropdownGroup = ({ dropdownName, item, itemPlural, dataSource }) =>
            <div className='form-group'>
                <div className={'form-label'}>
                    {itemPlural}
                </div>
                {dataSource?.length === 0 ? (<p>No {itemPlural.toLowerCase()} available.</p>) : (
                    <>
                        <div className={'form-section'}>
                            {formData[dropdownName].map((userId, index) => (
                                <div key={index} className='dropdown-item'>
                                    <Dropdown
                                        name={dropdownName}
                                        value={userId}
                                        options={getSelectableItems(index, dropdownName).map(el => ({
                                            id: el.id,
                                            name: dropdownName === 'manager_ids' ?
                                                el.first_name + ' ' + el.last_name :
                                                el.name
                                        }))}
                                        onChange={(e) => handleChange(e, index)}
                                        placeholder={`Select ${item}`}
                                        noneAllowed={true}
                                    />
                                    {(index > 0 || formData[dropdownName][0] !== null ) && (
                                        <Button
                                            className={'remove-button'}
                                            onClick={() => handleRemoveItem(dropdownName, index)}
                                            icon={'cancel'}
                                            transparent={true}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            className={'new-dropdown-button'}
                            onClick={() => handleAddItem(dropdownName)}
                            icon={'add_circle'}
                            label={`Add ${item}`}
                            disabled={!(addNewItem(dropdownName))}
                            transparent={true}
                        />
                    </>
                )}
            </div>;

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
                <MultiDropdownGroup
                    dropdownName={'role_ids'}
                    item={'Role'}
                    itemPlural={'Roles'}
                    dataSource={roles}
                />
                <MultiDropdownGroup
                    dropdownName={'manager_ids'}
                    item={'Manager'}
                    itemPlural={'Managers'}
                    dataSource={managers}
                />
                <div className='form-section align-center'>
                    <Button
                        className={'save-button'}
                        type={'submit'}
                        label={userId ? 'Save changes' : 'Create team'}
                        icon={'save'}
                    />
                    <Button
                        className={'discard-button'}
                        type={'button'}
                        label={'Discard'}
                        icon={'close'}
                        onClick={closeTopModal}
                    />
                </div>
            </form>
        </>
    );
};

export default UserEdit;