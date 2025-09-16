// FRONTEND/components/Users/Index.js
import React, { useEffect, useState, useMemo } from 'react';
import { useContextMenu, Menu, Item, Separator } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";
import { useModals } from '../../contexts/ModalContext';
import useUser from '../../hooks/useUser';
import Loader from '../Loader';
import Button from '../Button';
import '../../assets/styles/List.css';
import '../../assets/styles/Users.css';

const MENU_ID = '2137';

const HeaderCell = ({ header, filters, sortConfig, handleFilter, handleSorting }) =>
        <div className={`app-list-header-cell ${header.key}`} key={header.key}>
            <div className={'app-list-header-cell-label'}>
                {header.title}
            </div>
            <div className={'app-list-header-cell-actions'}>
                <input
                    className='search'
                    title={header.title}
                    placeholder={`Filter by the ${header.title.toLowerCase()}...`}
                    name={header.key}
                    value={filters[header.key] || ''}
                    onChange={handleFilter}
                />
                <Button
                    className={`order ${sortConfig.key === header.key ? sortConfig.direction : ''}`}
                    name={header.key}
                    onClick={handleSorting}
                    icon={sortConfig.key === header.key &&
                    sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                />
            </div>
        </div>;

const UsersTable = ({ users, loading, selectedUsers, setSelectedUsers, managers=true, managed_users=false }) => {
    const { openModal, refreshData, closeTopModal } = useModals();
    const { deleteUser } = useUser();
    const { show } = useContextMenu({ id: MENU_ID, });
    const [headerCollapsed, setHeaderCollapsed] = useState(true);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    function displayMenu(e, id) {
        show({event: e, props: { id }});
    }

    function handleItemClick({ id, props }){
        switch (id) {
            case 'select':
                handleUserSelect(props.id);
                break;
            case "delete":
                openModal({
                    content: 'confirm',
                    type: 'pop-up',
                    message: 'Are you sure you want to delete this user? This action cannot be undone.',
                    onConfirm: () => {
                        deleteUser(props.id).then();
                        refreshData('users', true);
                        closeTopModal();
                    },
                });
                break;
            case "edit":
                openModal({content: 'userEdit', contentId: props.id});
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

    const headers = useMemo(() => {
        let baseHeaders = [
            { title: 'Name', key: 'name' },
            { title: 'Roles', key: 'roles' }
        ];
        if (managers) {
            baseHeaders.push({ title: 'Managers', key: 'managers' });
        }
        if (managed_users) {
            baseHeaders.push({ title: 'Users Count', key: 'managed_users' });
        }
        return baseHeaders;
    }, [managers, managed_users]);

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        if (value.trim() !== '') {
            e.target.classList.add('non-empty');
        } else {
            e.target.classList.remove('non-empty');
        }
    };

    const handleSorting = (e) => {
        const field = e.currentTarget.name;
        e.target.classList.add('active');
        setSortConfig(prev => ({
            key: field,
            direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleUserSelect = (id) => {
        setSelectedUsers(prev => {
            const newSelected = new Set(prev);
            if (newSelected?.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const filteredAndSortedUsers = useMemo(() => {
        if (!users) return null;

        let result = [...users];

        result = result.filter(user => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                if (key === 'name') {
                    return (user.first_name + ' ' + user.last_name)?.toLowerCase().includes(value.toLowerCase());
                }

                if (key === 'roles') {
                    return user.roles?.some(role =>
                        role.name?.toLowerCase().includes(value.toLowerCase())
                    );
                }

                if (key === 'active') {
                    const filterValue = value.toLowerCase();
                    const trueValues = ['active', 'true', 'yes', '1', 1, 'y'];
                    const falseValues = ['not', 'non', 'not-active', 'no', 'n', 'false', '0', 0]
                    return (trueValues.includes(filterValue.toLowerCase()) && user[key]) || (falseValues.includes(filterValue.toLowerCase()) && !user[key]);
                }

                if (key === 'managers') {
                    return (user.managers || []).some(manager =>
                        (manager.first_name + ' ' + manager.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }

                if (key === 'managed_users') {
                    return (user['managed_users'] || user['managed-users'] || []).some(mu =>
                        (mu.first_name + ' ' + mu.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }

                return user[key]?.toLowerCase().includes(value.toLowerCase());
            });
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'name') {
                    aValue = (a.first_name + ' ' + a.last_name).toLowerCase();
                    bValue = (b.first_name + ' ' + b.last_name).toLowerCase();
                } else if (sortConfig.key === 'active') {
                    aValue = a.active ? 'active' : 'not';
                    bValue = b.active ? 'active' : 'not';
                } else if (sortConfig.key === 'managers') {
                    aValue = (a.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                    bValue = (b.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                } else {
                    aValue = a[sortConfig.key]?.toLowerCase?.() ?? '';
                    bValue = b[sortConfig.key]?.toLowerCase?.() ?? '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [users, filters, sortConfig]);

    if (loading) return <Loader />;

    const selectionMode = selectedUsers?.size > 0;

    return (
        <div className={`app-list users-list seethrough app-overflow-hidden${selectionMode ? ' selection-mode' : ''}`}>
            <div className={`app-list-header-row${headerCollapsed ? ' collapsed' : ''}`}>
                {headers.map((header) => (
                    <HeaderCell
                        key={header.key}
                        header={header}
                        filters={filters}
                        sortConfig={sortConfig}
                        handleFilter={handleFilter}
                        handleSorting={handleSorting}
                    />
                ))}
                <Button
                    className={'collapse_header'}
                    transparent={true}
                    icon={headerCollapsed ? 'add_circle' : 'remove_circle'}
                    onClick={() => setHeaderCollapsed(prev => !prev)}
                />
            </div>
            <div className='app-list-content app-overflow-y app-scroll'>
                { filteredAndSortedUsers?.length === 0 ? (
                    <p>No users found.</p>
                ) : (filteredAndSortedUsers?.map(user => {
                    const roles = user.roles || [];
                    const displayedRoles = roles.slice(0, 1);
                    const moreRolesCount = roles.length - 1;
                    const moreRolesText = moreRolesCount > 0 ? `+${moreRolesCount} other roles` : '';

                    return (
                        <div
                            className={`app-list-row${selectedUsers?.has(user.id) ? ' selected' : ''}`}
                            key={user.id}
                            onClick={(e) => { if(e.shiftKey || selectedUsers?.size > 0) {
                                e.preventDefault();
                                handleUserSelect(user.id);
                            }}}
                            onContextMenu={(e) => displayMenu(e, user.id)}
                        >
                            <div 
                                className={'app-list-row-cell name app-clickable'} 
                                onClick={() => {if (!selectionMode)
                                     openModal({ content: 'userDetails', type: 'dialog', contentId: user.id });
                                    }}
                            >
                                {user.first_name} {user.last_name}
                            </div>
                            <div className={'app-list-row-cell roles'}>
                                {displayedRoles.map((role) => (
                                    <span 
                                        key={role.id}
                                        className='role-name app-clickable'
                                        onClick={() => {if (!selectionMode)
                                            openModal({ content: 'roleDetails', type: 'dialog', contentId: role.id });
                                        }}
                                    > {role.name} </span>
                                ))}
                                {moreRolesText}
                            </div>
                            {managers && (
                                <div className={'app-list-row-cell managers'}>
                                    {(user.managers || []).length === 0
                                        ? <span>-</span>
                                        : (user.managers || []).map(manager =>
                                            <span 
                                                key={manager.id}
                                                className='manager-name app-clickable'
                                                onClick={() => {if (!selectionMode) 
                                                    openModal({ content: 'userDetails', contentId: manager.id });
                                            }}
                                            >{manager.first_name} {manager.last_name}</span>
                                        ).reduce((prev, curr) => [prev, ', ', curr])
                                    }
                                </div>
                            )}
                            {managed_users && (
                                <div className={'app-list-row-cell managed-users'}>
                                    {((user.managed_users || user['managed-users']) || []).length === 0
                                        ? <span>-</span>
                                        : ((user.managed_users || user['managed-users']) || []).length
                                    }
                                </div>
                            )}
                        </div>
                    );
                }))}
            </div>
                { selectionMode ?
                <Menu className={'app-context-menu'} id={MENU_ID}>
                    <Item id="select-all" onClick={handleItemClick}>
                        Select All
                    </Item>
                    <Item id="clear-selection" onClick={handleItemClick}>
                        Clear Selection
                    </Item>
                    <Separator />
                    <Item id="bulk-delete" onClick={handleItemClick}>
                        Delete Users
                    </Item>
                    <Separator />
                    <Item id="bulk-assign-role" onClick={handleItemClick}>
                        Assign Role
                    </Item>
                    <Item id="bulk-assign-manager" onClick={handleItemClick}>
                        Assign Manager
                    </Item>
                    <Item id="bulk-assign-team" onClick={handleItemClick}>
                        Assign to Team
                    </Item>
                </Menu> :
                <Menu className={'app-context-menu'} id={MENU_ID} >
                    <Item id="select" onClick={handleItemClick}>
                        Select user
                    </Item>
                    <Item id="edit" onClick={handleItemClick}>
                        Edit user
                    </Item>
                    <Item id="delete" onClick={handleItemClick}>
                        Delete user
                    </Item>
                    <Separator />
                    <Item id="assign-manager" onClick={handleItemClick}>
                        Assign new manager
                    </Item>
                </Menu>
                }
        </div>
    );
}

const UsersIndexPage = ({content='users'}) => {
    const { openModal, refreshTriggers } = useModals();
    const { users, usersLoading, fetchUsers } = useUser();
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

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}>{pageTitle}</h1>
                {
                    selectedUsers?.size > 0 &&
                    <div className="selected-items">
                        <p className="seethrough">
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
            <UsersTable
                users={users}
                loading={usersLoading}
                managed_users={content === 'managers'}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
            />
        </>
    );

}

export const ManagersIndex = () => <UsersIndexPage content={'managers'} />

export const EmployeesIndex = () => <UsersIndexPage content={'employees'} />

export const UsersIndex = () => <UsersIndexPage />;

export default UsersIndex;