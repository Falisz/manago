// FRONTEND/components/Teams/Index.js
import React, { useEffect, useState, useMemo } from "react";
import { useModals } from "../../contexts/ModalContext";
import useTeams from "../../hooks/useTeams"; // You need to implement this hook similar to useUsers
import Loader from "../Loader";
import Button from "../Button";
import '../../assets/styles/Teams.css';

// Table header component for Teams
const TeamTableHeader = ({ header, filters, handleFilter, sortConfig, handleSorting }) => (
    <div className="teams-list-header-cell" key={header.key}>
        <label>{header.title}</label>
        <input
            className="search"
            title={header.title}
            placeholder={`Filter by the ${header.title.toLowerCase()}...`}
            name={header.key}
            value={filters[header.key] || ''}
            onChange={handleFilter}
        />
        <button
            className={`order ${sortConfig.key === header.key ? sortConfig.direction : ''}`}
            name={header.key}
            onClick={handleSorting}
        >
            {sortConfig.key === header.key && sortConfig.direction === 'asc' ? '↑' : '↓'}
        </button>
    </div>
);

const TeamItem = ({ team }) => {
    const { openModal } = useModals();
    team.members_count = team.members ? team.members.length : 0

    return (
        <>
            <div className="team-item">
                <div onClick={() => openModal({ type: 'teamDetails', data: { id: team.id } })}>
                    {team.code_name}
                </div>
                <div onClick={() => openModal({ type: 'teamDetails', data: { id: team.id } })}>
                    {team.name}
                </div>
                <div>{team.members_count}</div>
                <div>
                    {(team.managers || []).length === 0
                        ? null
                        : (team.managers || []).map(manager =>
                            <span key={manager.id} className="manager-name"
                                onClick={() => openModal({ type: 'userDetails', data: { id: manager.id } })}
                            >{manager.first_name} {manager.last_name}</span>
                        ).reduce((prev, curr) => [prev, ', ', curr])
                    }
                </div>
                <div>
                    {(team.team_leaders || []).length === 0
                        ? null
                        : (team.team_leaders || []).map(leader =>
                            <span key={leader.id} className="teamleader-name"
                                onClick={() => openModal({ type: 'userDetails', data: { id: leader.id } })}
                            >{leader.first_name} {leader.last_name}</span>
                        ).reduce((prev, curr) => [prev, ', ', curr])
                    }
                </div>
            </div>
            {team.subteams && team.subteams?.length > 0 ? (
                <div className="subteams">
                    {team.subteams.map(subteam => (
                        <TeamItem key={subteam.id} team={subteam} />
                    ))}
                </div>
                ) : null}
        </>
    );
}

const TeamsTable = () => {
    const { teams, loading, fetchTeams } = useTeams();
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

    const headers = useMemo(() => [
        { title: 'Codename', key: 'codename' },
        { title: 'Name', key: 'name' },
        { title: 'Members', key: 'members_count' },
        { title: 'Managers', key: 'managers' },
        { title: 'Team Leaders', key: 'team_leaders' }
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
                    return (team.managers || []).some(manager =>
                        (manager.first_name + ' ' + manager.last_name).toLowerCase().includes(value.toLowerCase())
                    );
                }
                if (key === 'team_leaders') {
                    return (team.team_leaders || []).some(leader =>
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
                    aValue = (a.team_leaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
                    bValue = (b.team_leaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
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
    }, [teams, filters, sortConfig]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="teams-list">
            <div className="teams-list-header">
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
            <div className="teams-list-content">
                {filteredAndSortedTeams?.length === 0 ? (
                    <p>No teams found.</p>
                ) : (filteredAndSortedTeams?.map(team => (
                    <div className="teams-list-row" key={team.id}>
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
            <h1>Teams in Zyrah</h1>
            <Button
                className="new-team-button"
                onClick={() => openModal({ type: 'teamNew' })}
                label={'Add new Team'}
                icon={'add'}
            />
            <TeamsTable/>
        </>
    );
};

export default TeamsIndex;