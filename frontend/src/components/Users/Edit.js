// FRONTEND/components/Users/Edit.js
import React, {useEffect, useMemo, useState} from 'react';
import {useModals} from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import useRole from '../../hooks/useRole';
import Loader from '../Loader';
import Dropdown from '../Dropdown';
import Button from '../Button';
import '../../assets/styles/Form.css';
import EditForm from "../EditForm";

const MultiDropdownGroup = ({
                                dropdownName,
                                item,
                                itemPlural,
                                dataSource,
                                getSelectableItems,
                                handleChange,
                                formData,
                                handleRemoveItem,
                                handleAddItem,
                                addNewItem
                            }) =>
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
                            {(index > 0 || formData[dropdownName][0] !== null) && (
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

export const UserRoleBulkAssignment = ({users}) => {
    const {closeTopModal} = useModals();
    const {roles, rolesLoading: loading, fetchRoles} = useRole();
    const [formData, setFormData] = useState({mode: 'add', roleId: null});

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    const handleChange = (e) => {
        const {value, name} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }
    const handleSubmit = () => {
        console.warn('User Role assignment feature not implemented yet.');
        closeTopModal();
    }

    const header = (formData.mode === 'add' ? 'Assigning Role to ' : 'Removing Role from ') +
        ( users.length > 1 ?
            `${users.length} User${users.length > 1 ? 's' : ''}` :
            users[0].first_name + ' ' + users[0].last_name );

    if (loading) return <Loader/>;

    return <>
        <h1>
            {header}
        </h1>
        <div className='app-form' style={{minHeight: '100px'}}>
            {users.length > 1 ? <>
                <h2 className={'form-header'}>Selected Users</h2>
                <div>
                    {users?.map((user, index) =>
                        (user.first_name + ' ' + user.last_name + (index !== users.length - 1 ? ', ' : '')))
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
                    label={((formData.mode === 'remove') ? 'Remove' : 'Assign') + ' Roles' }
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
}

export const UserRoleAssignment = ({user}) => {
    const {closeTopModal, setDiscardWarning} = useModals();
    const {roles, rolesLoading: loading, fetchRoles} = useRole();
    const [formData, setFormData] = useState({role_ids: []});

    useEffect(() => {
        fetchRoles().then();
    }, [fetchRoles]);

    useEffect(() => {
        if (user)
            setFormData(prev => ({...prev, role_ids: user.roles.map(role => role.id)}));
    }, [user])

    const getSelectableItems = (index, dropdownName) => {
        const currentSelected = formData[dropdownName] && formData[dropdownName][index];

        if (dropdownName === 'role_ids') {
            return roles?.filter(
                role => (role.id === currentSelected || !formData.role_ids.includes(role.id))
            ) || [];
        }

        return [];
    }

    const addNewItem = (dropdownName) => {
        return !formData[dropdownName].includes(null) && formData[dropdownName].length < roles.length;
    };

    const handleChange = (e, index) => {
        const {value, name} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: [
                ...prev[name].slice(0, index),
                parseInt(value) || null,
                ...prev[name].slice(index + 1),
            ],
        }));
    }

    const handleAddItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], null],
        }))
    }

    const handleRemoveItem = (field, index) => {
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


    const handleSubmit = () => {
        console.warn('User Role assignment feature not implemented yet.');
        closeTopModal();
    }

    if (loading) return <Loader/>;

    if (user) {
        return <>
            <h1>Editing Roles of {user.first_name + ' ' + user.last_name}</h1>
            <form className={'app-form'} onSubmit={handleSubmit}>
                <MultiDropdownGroup
                    dropdownName={'role_ids'}
                    item={'Role'}
                    itemPlural={'Roles'}
                    dataSource={roles}
                    getSelectableItems={getSelectableItems}
                    handleChange={handleChange}
                    formData={formData}
                    handleRemoveItem={handleRemoveItem}
                    handleAddItem={handleAddItem}
                    addNewItem={addNewItem}
                />
                <div className='form-section align-center'>
                    <Button
                        className={'save-button'}
                        type={'submit'}
                        label={'Save changes'}
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
        </>;
    }
};

const UserEdit = ({userId, preset}) => {
    const {user, loading, setLoading, error, fetchUser, saveUser} = useUser();
    const {users: managers, fetchUsers} = useUser();
    const {roles, fetchRoles} = useRole();

    useEffect(() => {
        fetchRoles().then();
        fetchUsers('managers').then();
        if (userId) {
            fetchUser(userId).then();
        } else {
            setLoading(false);
        }
    }, [userId, setLoading, fetchUser, fetchRoles, fetchUsers]);

    let name = 'User';
    let presetValues;
    if (preset === 'manager') {
        name = 'Manager';
        presetValues = [
            {field: 'roles', value: [11]},
            {field: 'manager_view_access', value: true}
        ];
    } else if (preset === 'employee') {
        name = 'Employee';
        presetValues = [
            {field: 'roles', value: [1]}
        ]
    }
    const formStructure = useMemo(() => ({
        header: {
            title: userId ? `Editing ${user?.first_name} ${user?.last_name}` : `Creating new ${name}`,
        },
        inputs: {
            firstName: {
                section: 0,
                field: 'first_name',
                type: 'string',
                inputType: 'input',
                label: 'First Name',
                required: true
            },
            lastName: {
                section: 0,
                label: 'Last Name',
                field: 'last_name',
                type: 'string',
                inputType: 'input',
                required: true
            },
            email: {
                section: 1,
                label: 'Email Address',
                field: 'email',
                type: 'string',
                inputType: 'input',
                required: true
            },
            login: {
                section: 1,
                label: 'Login Alias',
                field: 'login',
                type: 'string',
                inputType: 'input'
            },
            active: {
                section: 2,
                label: 'Active',
                field: 'active',
                type: 'boolean',
                inputType: 'checkbox',
                inputLabel: 'Should user be active',
                style: {alignItems: 'flex-start'}
            },
            mgrViewAccess: {
                section: 2,
                label: 'Manager View Access',
                field: 'manager_view_access',
                type: 'boolean',
                inputType: 'checkbox',
                inputLabel: 'Should user has access to the Manager Portal',
                style: {alignItems: 'flex-start'}
            },
            roles: {
                section: 3,
                label: 'Roles',
                field: 'roles',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: roles,
                itemNameField: 'name',
                itemName: 'Role',
            },
            managers: {
                section: 4,
                label: 'Managers',
                field: 'managers',
                type: 'id-list',
                inputType: 'multi-dropdown',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemName: 'Manager',
            }
        },
        onSubmit: {
            onSave: (data, id) => saveUser(data, id),
            refreshTriggers: [['users', true], ...(user ? [['user', user.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [name, saveUser, user, userId, roles, managers]);

    if (loading) return <Loader/>;

    if (error) return <div className='error-message'>{error}</div>;

    return (
        <EditForm
            structure={formStructure}
            data={userId && user}
            preset={!userId && presetValues}
        />
    );
};

export default UserEdit;