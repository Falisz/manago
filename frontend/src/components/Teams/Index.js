// FRONTEND/components/Teams/Index.js
import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import Loader from '../Loader';
import Button from '../Button';
import '../../assets/styles/List.css';
import '../../assets/styles/Teams.css';
import Icon from "../Icon";
import {Item, Menu, useContextMenu} from "react-contexify";

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

const TeamsIndex = () => {
    const { openModal, refreshData, refreshTriggers, closeTopModal } = useModals();
    const { teams, teamsLoading: loading, fetchTeams, deleteTeam } = useTeam();
    const [ selectedTeams, setSelectedTeams ] = useState(new Set());
    const [headerCollapsed, setHeaderCollapsed] = useState(true);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const { show } = useContextMenu({ id: MENU_ID, });

    function displayMenu(e, team) {
        show({event: e, props: { team }});
    }

    function handleItemClick({ id, props }) {
        switch (id) {
            case 'select':
                handleTeamSelect(props.team.id);
                break;
            case 'edit':
                openModal({content: 'teamEdit', contentId: props.team.id});
                break;
            case "delete": {
                    let message = `Are you sure you want to delete this role? This action cannot be undone.`
                    const teamId = props.team.id;
                    const users = props.team.members ? props.team.members.length : 0;
                    const subteams = props.team.subteams ? props.team.subteams.length : 0;

                    if (users > 0) {
                        message += ` There are currently ${users === 1 ? 'a' : users} user${users > 1 ? 's' : ''} assigned to this team.`
                    }
                    if (subteams > 0) {
                        message += ` This team has currently ${subteams === 1 ? 'a' : subteams} subteam${subteams > 1 ? 's' : ''}.
                        Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned.`
                    }
                    openModal({
                        content: 'confirm',
                        type: 'pop-up',
                        message: message,
                        onConfirm: () => {
                            deleteTeam(teamId).then();
                            refreshData('teams', true);
                            closeTopModal();
                        },
                        onConfirm2: subteams > 0 ? () => {
                            deleteTeam(teamId, true).then();
                            refreshData('teams', true);
                            closeTopModal();
                        } : null,
                        confirmLabel: subteams > 0 ? 'Delete only this team' : 'Delete the team',
                        confirmLabel2: 'Delete team and subteams',
                    });
                };
                break;
            case 'select-all':
                setSelectedTeams(new Set(teams.map(team => team.id)));
                break;
            case 'clear-selection':
                setSelectedTeams(new Set());
                break;
            default:
                console.info(`${id} option to be implemented.`);
                break;
        }
    }

    useEffect(() => {
        if (!teams) {
            fetchTeams().then();
        }
    }, [fetchTeams, teams]);

    useEffect(() => {
        if (refreshTriggers?.teams) {
            fetchTeams().then();
        }
    }, [refreshTriggers, fetchTeams]);

    const headers = useMemo(() => [
        { title: 'Name', key: 'name' },
        { title: 'Managers', key: 'managers' },
        { title: 'Leaders', key: 'leaders' },
        { title: 'Members', key: 'members_count' }
    ], []);

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

    const collectTeamMembers = useCallback((team, type) => {
        let members = [];
        if (type === 'managers' && team.managers) {
            members = [...team.managers];
        } else if (type === 'leaders' && team.leaders) {
            members = [...team.leaders];
        }

        if (team.subteams && team.subteams.length > 0) {
            team.subteams.forEach(subteam => {
                members = [...members, ...collectTeamMembers(subteam, type)];
            });
        }
        return members;
    }, []);

    const handleTeamSelect = (id) => {
        setSelectedTeams(prev => {
            const newSelected = new Set(prev);
            if (newSelected?.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const filteredAndSortedTeams = useMemo(() => {
        if (!teams) return null;
        let result = [...teams];

        result = result.filter(team => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                if (key === 'name') {
                    return team.name?.toLowerCase().includes(value.toLowerCase()) || 
                    team.code_name?.toLowerCase().includes(value.toLowerCase());
                }
                if (key === 'members_count') {
                    return team.members ? team.members.length === value : false;
                }
                if (key === 'managers') {
                    const allManagers = collectTeamMembers(team, 'managers');
                    return allManagers.some(manager =>
                        (manager.first_name + ' ' + manager.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }
                if (key === 'leaders') {
                    const allLeaders = collectTeamMembers(team, 'leaders');
                    return allLeaders.some(leader =>
                        (leader.first_name + ' ' + leader.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }
                return true;
            });
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'managers') {
                    aValue = (a.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                    bValue = (b.managers || []).map(m => (m.first_name + ' ' + m.last_name).toLowerCase()).join(', ');
                } else if (sortConfig.key === 'team_leaders') {
                    aValue = (a.leaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
                    bValue = (b.leaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
                } else if (sortConfig.key === 'members_count') {
                    aValue = a.members_count ?? 0;
                    bValue = b.members_count ?? 0;
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
    }, [teams, filters, sortConfig, collectTeamMembers]);

    const openTeamDetails = (contentId) => {
        openModal({
            content: 'teamDetails',
            type: 'dialog',
            contentId
        });
    };

    if (loading) return <Loader />;

    const selectionMode = selectedTeams?.size > 0;

    const TeamRow = ({ team, sub = false }) => 
            <>
                <div 
                    key={team.id}   
                    className={`app-list-row${selectedTeams?.has(team.id) ? ' selected' : ''}`}
                    onClick={(e) => { if(e.shiftKey || selectedTeams?.size > 0) {
                        e.preventDefault();
                        handleTeamSelect(team.id);
                    }}}
                    onContextMenu={(e) => displayMenu(e, team)}
                >
                    <div
                        className={`app-list-row-cell ${ sub ? 'subteam-name' : 'name'} app-clickable`}
                        onClick={() => {if (!selectionMode) openTeamDetails(team.id)}}
                    >
                        {team.name}
                    </div>
                    <div
                        className={'app-list-row-cell managers'}
                    >
                        {(team.managers || []).length === 0
                            ? null
                            : (team.managers || []).map(manager =>
                                <span
                                    key={manager.id}
                                    className='manager-name app-clickable'
                                    onClick={() => { if (!selectionMode)
                                        openModal({ content: 'userDetails', type: 'dialog', contentId: manager.id })
                                    }}
                                >{manager.first_name} {manager.last_name}</span>
                            ).reduce((prev, curr) => [prev, ', ', curr])
                        }
                    </div>
                    <div
                        className={'app-list-row-cell team-leaders'}
                    >
                        {(team.leaders || []).length === 0
                            ? null
                            : (team.leaders || []).map(leader =>
                                <span 
                                    key={leader.id}
                                    className='teamleader-name app-clickable'
                                    onClick={() => { if (!selectionMode)
                                        openModal({ content: 'userDetails', type: 'dialog', contentId: leader.id })
                                    }}
                                >{leader.first_name} {leader.last_name}</span>
                            ).reduce((prev, curr) => [prev, ', ', curr])
                        }
                    </div>
                    <div
                        className={'app-list-row-cell members-count'}
                    >
                        {team.members ? team.members.length : 0}
                    </div>
                </div>
                {team.subteams && team.subteams?.length > 0 ? (
                    <div className='app-list-sub-rows'>
                        {team.subteams.map(subteam => (
                            <TeamRow key={subteam.id} team={subteam} sub={true}/>
                        ))}
                    </div>
                    ) : null}
            </>;

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Teams in Zyrah </h1>
                {
                    selectionMode &&
                    <div className="selected-items">
                        <p className="seethrough">
                            {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected.
                        </p>
                        <Button
                            onClick={() => setSelectedTeams(new Set())}
                            label={'Clear selection'}
                        />
                        <Button
                            onClick={() => setSelectedTeams(new Set(teams.map(team => team.id)))}
                            label={'Select all'}
                        />
                    </div>
                }
                <Button
                    className='new-team'
                    onClick={() => openModal({ content: 'teamNew' })}
                    label={'Add team'}
                    icon={'add'}
                />
            </div>
            <div className={`app-list teams-list seethrough app-overflow-hidden${selectionMode ? ' selection-mode' : ''}`}>
                <div className={`app-list-header-row${headerCollapsed ? ' collapsed' : ''}`}>
                    {headers.map((header) => (
                        <HeaderCell
                            key={header.key}
                            header={header}
                            sortConfig={sortConfig}
                            filters={filters}
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
                    {filteredAndSortedTeams?.length === 0 ? (
                        <p>No teams found.</p>
                    ) : (filteredAndSortedTeams?.map(team => (
                        <div className='app-list-row-stack' key={team.id}>
                            <TeamRow team={team} />
                        </div>
                    )))}
                </div>
                {   selectionMode ?
                        <Menu className={'app-context-menu'} id={MENU_ID}>
                            <Item id="select-all" onClick={handleItemClick}>
                                Select All
                            </Item>
                            <Item id="clear-selection" onClick={handleItemClick}>
                                Clear Selection
                            </Item>
                        </Menu> : 
                        <Menu className={'app-context-menu'} id={MENU_ID}>
                            <Item id="select" onClick={handleItemClick}>
                                Select Team
                            </Item>
                            <Item id="edit" onClick={handleItemClick}>
                                Edit Team
                            </Item>
                            <Item id="delete" onClick={handleItemClick}>
                                Delete Team
                            </Item>
                        </Menu>
                }
            </div>
        </>
    );
};

export default TeamsIndex;