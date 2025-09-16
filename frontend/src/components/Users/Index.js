// FRONTEND/components/Users/Index.js
import React, { useEffect, useState } from 'react';
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import Button from '../Button';
import Loader from '../Loader';
import Table from '../Table';

const UsersIndexPage = ({content='users'}) => {
    const { openModal, refreshData, closeTopModal, refreshTriggers } = useModals();
    const { users, usersLoading: loading, fetchUsers, deleteUser } = useUser();
    const [ selectedUsers, setSelectedUsers ] = useState(new Set());

    const itemName = {
        singular: content.slice(0,-1),
        plural: content,
        singular_capitalised: content.charAt(0).toUpperCase() + content.slice(1,-1),
        plural_capitalised: content.charAt(0).toUpperCase() + content.slice(1),
    };
    const pageTitle = itemName.plural_capitalised + ' of Zyrah';

    const newItemModalContent = content === 'employees' ? 'employeeNew' :
        content === 'managers' ? 'managerNew' : 'userNew';

    useEffect(() => {
        if (!users) {
            fetchUsers(content).then();
        }
    }, [content, users, fetchUsers]);

    useEffect(() => {
        if (refreshTriggers?.users) {
            fetchUsers(content).then();
        }
    }, [content, refreshTriggers, fetchUsers]);

    const handleUserSelect = (id) => {
        setSelectedUsers(prev => {
            const newSelected = new Set(Array.from(prev));
            if (newSelected?.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const fields = {
        name: {
            title: 'Name',
            display: true,
            sortable: true,
            filterable: true,
            type: 'string',
            openModal: 'userDetails'
        },
        roles: {
            title: 'Roles',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'roleDetails'
        },
        managers: {
            title: 'Managers',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'userDetails'
        },
        users_count: {
            title: 'Users Count',
            display: content === 'managers',
            sortable: true,
            filterable: true,
            style: {maxWidth: 100+'px'},
            type: 'number',
            computeValue: (data) => data.managed_users?.length || 0
        }
    }

    const contextMenuItems = [
        { id: 'select', label: 'Select Team', selectionMode: false },
        { id: 'edit', label: 'Edit Team', selectionMode: false },
        { id: 'delete', label: 'Delete Team', selectionMode: false },
        { id: 'select-all', label: 'Select All', selectionMode: true },
        { id: 'clear-selection', label: 'Clear Selection', selectionMode: true }
    ];

    if (loading) return <Loader />;

    const handleContextMenuClick = ({ id, props }) => {
        const user = props;
        switch (id) {
            case 'select':
                handleUserSelect(user.id);
                break;
            case 'delete':
                openModal({
                    content: 'confirm',
                    type: 'pop-up',
                    message: 'Are you sure you want to delete this user? This action cannot be undone.',
                    onConfirm: () => {
                        deleteUser(user.id).then();
                        refreshData('users', true);
                        closeTopModal();
                    },
                });
                break;
            case 'edit':
                openModal({content: 'userEdit', contentId: user.id});
                break;
            case 'select-all':
                setSelectedUsers(new Set(users.map(user => user.id)));
                break;
            case 'clear-selection':
                setSelectedUsers(new Set());
                break;
            default:
                console.warn(`${id} option to be implemented.`);
                break;
        }
    }

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}>{pageTitle}</h1>
                {
                    selectedUsers?.size > 0 &&
                    <div className='selected-items'>
                        <p className='seethrough'>
                            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected.
                        </p>
                        <Button
                            onClick={() => setSelectedUsers(new Set())}
                            label={'Clear selection'}
                        />
                        <Button
                            onClick={() => setSelectedUsers(new Set(users.map(user => user.id)))}
                            label={'Select all'}
                        />
                    </div>
                }
                <Button
                    className='new-user'
                    onClick={() => openModal({content: newItemModalContent})}
                    label={`Add ${itemName.singular_capitalised}`}
                    icon={'add'}
                />
            </div>
            <Table
                dataSource={users}
                fields={fields}
                hasHeader={true}
                hasContextMenu={true}
                contextMenuItems={contextMenuItems}
                handleContextMenuClick={handleContextMenuClick}
                hasSelectableRows={true}
                selectedItems={selectedUsers}
                setSelectedItems={setSelectedUsers}
                dataPlaceholder={'No Users found.'}
            />
        </>
    );

}

export const ManagersIndex = () => <UsersIndexPage content={'managers'} />

export const EmployeesIndex = () => <UsersIndexPage content={'employees'} />

export const UsersIndex = () => <UsersIndexPage />;

export default UsersIndex;