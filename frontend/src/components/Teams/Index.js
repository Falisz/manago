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

const TeamsTable = ({ teams, loading }) => {
    const { openModal } = useModals();

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const headers = useMemo(() => [
        { title: 'Codename', key: 'codename' },
        { title: 'Name', key: 'name' },
        { title: 'Members', key: 'members_count' },
        { title: 'Managers', key: 'managers' },
        { title: 'Team Leaders', key: 'teamleaders' }
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
                    return team.codename?.toLowerCase().includes(value.toLowerCase());
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
                if (key === 'teamleaders') {
                    return (team.teamleaders || []).some(leader =>
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
                } else if (sortConfig.key === 'teamleaders') {
                    aValue = (a.teamleaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
                    bValue = (b.teamleaders || []).map(l => (l.first_name + ' ' + l.last_name).toLowerCase()).join(', ');
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
                    <div className="teams-list-row" key={team.ID}>
                        <div onClick={() => openModal({ type: 'teamDetails', data: { id: team.ID } })}>
                            {team.codename}
                        </div>
                        <div>{team.name}</div>
                        <div>{team.members_count ?? (team.members ? team.members.length : 0)}</div>
                        <div>
                            {(team.managers || []).length === 0
                                ? <span>-</span>
                                : (team.managers || []).map(manager =>
                                    <span key={manager.ID} className="manager-name"
                                        onClick={() => openModal({ type: 'userDetails', data: { id: manager.ID } })}
                                    >{manager.first_name} {manager.last_name}</span>
                                ).reduce((prev, curr) => [prev, ', ', curr])
                            }
                        </div>
                        <div>
                            {(team.teamleaders || []).length === 0
                                ? <span>-</span>
                                : (team.teamleaders || []).map(leader =>
                                    <span key={leader.ID} className="teamleader-name"
                                        onClick={() => openModal({ type: 'userDetails', data: { id: leader.ID } })}
                                    >{leader.first_name} {leader.last_name}</span>
                                ).reduce((prev, curr) => [prev, ', ', curr])
                            }
                        </div>
                    </div>
                )))}
            </div>
        </div>
    );
};

const TeamsIndex = () => {
    const { openModal } = useModals();
    const { teams, loading: teamsLoading, fetchTeams } = useTeams();

    useEffect(() => {
        if (!teams) {
            fetchTeams().then();
        }
    }, [fetchTeams, teams]);

    return (
        <>
            <h1>Teams in Zyrah</h1>
            <Button
                className="new-team-button"
                onClick={() => openModal({ type: 'teamNew' })}
                label={'Add new Team'}
                icon={'add'}
            />
            <TeamsTable
                teams={teams}
                loading={teamsLoading}
            />
        </>
    );
};

export default TeamsIndex;