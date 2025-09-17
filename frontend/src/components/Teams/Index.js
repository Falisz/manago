// FRONTEND/components/Teams/Index.js
import React, { useEffect, useState, useCallback } from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import Button from '../Button';
import Loader from '../Loader';
import Table from '../Table';

const TeamsIndex = () => {
    const { openModal, refreshData, refreshTriggers, closeTopModal } = useModals();
    const { teams, teamsLoading: loading, fetchTeams, deleteTeam } = useTeam();
    const [ selectedTeams, setSelectedTeams ] = useState(new Set());

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

    const handleTeamSelect = (id) => {
        setSelectedTeams(prev => {
            const newSelected = new Set(Array.from(prev));
            if (newSelected?.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const handleTeamDelete = (team) => {
        let message = `Are you sure you want to delete this team? This action cannot be undone.`;
        const teamId = team.id;
        const users = team.members ? team.members.length : 0;
        const subteams = team.subteams ? team.subteams.length : 0;

        if (users > 0) {
            message += ` There are currently ${users === 1 ? 'a' : users} user${users > 1 ? 's' : ''} assigned to this team.`;
        }
        if (subteams > 0) {
            message += ` This team has currently ${subteams === 1 ? 'a' : subteams} subteam${subteams > 1 ? 's' : ''}. Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned.`;
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
            confirmLabel2: subteams > 0 ? 'Delete team and subteams' : undefined,
        });
    };

    const handleTeamsDelete = () => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: `Are you sure you want to delete ${selectedTeams.size} selected Team${selectedTeams.size > 1 ? 's' : ''}? This action cannot be undone.`,
            onConfirm: () => {
                console.warn('Bulk Deletion to be implemented.');
                refreshData('teams', true);
                closeTopModal();
            },
        });

    }

    const collectAllTeamIds = useCallback((teamList) => {
        let ids = [];
        teamList.forEach(team => {
            ids.push(team.id);
            if (team.subteams && team.subteams.length > 0) {
                ids = [...ids, ...collectAllTeamIds(team.subteams)];
            }
        });
        return ids;
    }, []);

    const fields = {
        name: {
            title: 'Name',
            display: true,
            sortable: true,
            filterable: true,
            type: 'string',
            openModal: 'teamDetails'
        },
        managers: {
            title: 'Managers',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'userDetails'
        },
        leaders: {
            title: 'Leaders',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'userDetails'
        },
        members_count: {
            title: 'Members',
            display: true,
            sortable: true,
            filterable: true,
            type: 'number',
            style: {maxWidth: 100+'px'},
            computeValue: (data) => data.members?.length || 0
        }
    }

    const contextMenuActions = [
        { id: 'select', label: 'Select Team', selectionMode: false,
            action: (props) => handleTeamSelect(props.id) },
        { id: 'edit', label: 'Edit Team', selectionMode: false,
            action: (props) => openModal({content: 'teamEdit', contentId: props.id}) },
        { id: 'assign-member', label: 'Edit Members', selectionMode: false,
            action: (props) => openModal({content: 'teamMemberAssignment', type: 'dialog', data: [props]}) },
        { id: 'delete', label: 'Delete Team', selectionMode: false,
            action: (props) => handleTeamDelete(props) },
        { id: 'select-all', label: 'Select All', selectionMode: true,
            action: () => setSelectedTeams(new Set(collectAllTeamIds(teams))) },
        { id: 'select-all-main', label: 'Select Main Teams', selectionMode: true,
            action: () => setSelectedTeams(new Set(teams.map(team => team.id))) },
        { id: 'clear-selection', label: 'Clear Selection', selectionMode: true,
            action: () => setSelectedTeams(new Set()) },
        { id: 'bulk-assign-member', label: 'Assign Members', selectionMode: true,
            action: () => openModal({content: 'teamMemberAssignment', type: 'dialog', data: teams.filter(team => selectedTeams.has(team.id))}) },
        { id: 'bulk-delete', label: 'Delete Selected', selectionMode: true,
            action: () => handleTeamsDelete() },
    ];

    if (loading) return <Loader />;

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Teams in Zyrah </h1>
                {
                    selectedTeams?.size > 0 &&
                    <div className='selected-items'>
                        <p className='seethrough'>
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

            <Table
                dataSource={teams}
                fields={fields}
                hasSelectableRows={true}
                contextMenuActions={contextMenuActions}
                selectedItems={selectedTeams}
                setSelectedItems={setSelectedTeams}
                dataPlaceholder={'No Teams found.'}
                subRowField={'subteams'}
            />
        </>
    );
};

export default TeamsIndex;