// FRONTEND/components/Teams/Index.js
import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import Loader from '../Loader';
import Button from '../Button';
import '../../assets/styles/List.css';
import '../../assets/styles/Teams.css';
import Icon from "../Icon";

// Table header component for Teams
const TeamTableHeader = ({ header, filters, handleFilter, sortConfig, handleSorting }) => (
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
    </div>
);

const TeamItem = ({ team, sub = false }) => {
    const { openModal } = useModals();

    team.members_count = team.members ? team.members.length : 0;

    const openTeamDetails = (contentId) => {
        openModal({
            content: 'teamDetails',
            type: 'dialog',
            contentId
        });
    };

    return (
        <>
            <div className='app-list-row'>
                <div
                    className={`app-list-row-cell ${ sub ? 'subteam-code-name' : 'code-name'} app-clickable`}
                    onClick={() => openTeamDetails(team.id)}
                >
                    {sub && <Icon i={'subdirectory_arrow_right'} />}
                    {team.code_name}
                </div>
                <div
                    className={`app-list-row-cell ${ sub ? 'subteam-name' : 'name'} app-clickable`}
                    onClick={() => openTeamDetails(team.id)}
                >
                    {team.name}
                </div>
                <div
                    className={'app-list-row-cell members-count'}
                >
                    {team.members_count}
                </div>
                <div
                    className={'app-list-row-cell managers'}
                >
                    {(team.managers || []).length === 0
                        ? null
                        : (team.managers || []).map(manager =>
                            <span key={manager.id} className='manager-name app-clickable'
                                onClick={() => openModal({ content: 'userDetails', type: 'dialog', contentId: manager.id })}
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
                            <span key={leader.id} className='teamleader-name app-clickable'
                                onClick={() => openModal({ content: 'userDetails', type: 'dialog', contentId: leader.id })}
                            >{leader.first_name} {leader.last_name}</span>
                        ).reduce((prev, curr) => [prev, ', ', curr])
                    }
                </div>
            </div>
            {team.subteams && team.subteams?.length > 0 ? (
                <div className='app-list-sub-rows'>
                    {team.subteams.map(subteam => (
                        <TeamItem key={subteam.id} team={subteam} sub={true} />
                    ))}
                </div>
                ) : null}
        </>
    );
}

const TeamsTable = () => {
    const { refreshTriggers } = useModals();
    const { teams, teamsLoading, fetchTeams } = useTeam();
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

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
        { title: 'Codename', key: 'codename' },
        { title: 'Name', key: 'name' },
        { title: 'Members', key: 'members_count' },
        { title: 'Managers', key: 'managers' },
        { title: 'Team Leaders', key: 'leaders' }
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
        const field = e.target.name;
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

    const filteredAndSortedTeams = useMemo(() => {
        if (!teams) return null;
        let result = [...teams];

        result = result.filter(team => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                if (key === 'codename') {
                    return team.code_name?.toLowerCase().includes(value.toLowerCase());
                }
                if (key === 'name') {
                    return team.name?.toLowerCase().includes(value.toLowerCase());
                }
                if (key === 'members_count') {
                    return String(team.members_count).includes(value);
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

    if (teamsLoading) {
        return <Loader />;
    }

    return (
        <div className='app-list teams-list seethrough app-overflow-hidden'>
            <div className='app-list-header-row'>
                {headers.map((header) => (
                    <TeamTableHeader
                        header={header}
                        filters={filters}
                        handleFilter={handleFilter}
                        sortConfig={sortConfig}
                        handleSorting={handleSorting}
                        key={header.key}
                    />
                ))}
            </div>
            <div className='teams-list-content app-overflow-y app-scroll'>
                {filteredAndSortedTeams?.length === 0 ? (
                    <p>No teams found.</p>
                ) : (filteredAndSortedTeams?.map(team => (
                    <div className='app-list-row-stack' key={team.id}>
                        <TeamItem team={team} />
                    </div>
                )))}
            </div>
        </div>
    );
};

const TeamsIndex = () => {
    const { openModal } = useModals();

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Teams in Zyrah </h1>
                <Button
                    className='new-team'
                    onClick={() => openModal({ content: 'teamNew' })}
                    label={'Add team'}
                    icon={'add'}
                />
            </div>
            <TeamsTable/>
        </>
    );
};

export default TeamsIndex;