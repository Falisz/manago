// FRONTEND/components/Teams/Index.js
import React, { useEffect, useCallback, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import useTeams from '../../hooks/useTeams';
import Loader from '../Loader';
import Table from '../Table';

const TeamsIndex = () => {
    const { refreshTriggers, refreshData } = useApp();
    const { openModal, closeTopModal } = useNav();
    const { teams, loading, fetchTeams, deleteTeams, deleteTeam } = useTeams();

    useEffect(() => {
        const refresh = refreshTriggers?.teams || false;

        if (refresh)
            delete refreshTriggers.teams;
        
        if (!teams || refresh)
            fetchTeams({all: true, loading: true}).then();

    }, [fetchTeams, teams, refreshTriggers.teams]);

    const handleTeamDelete = useCallback((team) => {
        let message = `Are you sure you want to delete this Team? This action cannot be undone.`;
        const teamId = team.id;
        const users = team.members ? team.members.length : 0;
        const subteams = team.subteams ? team.subteams.length : 0;

        if (users > 0) {
            message += ` There are currently ${users === 1 ? 'a' : users}`
                + ` User${users > 1 ? 's' : ''} assigned to this Team.`;
        }
        if (subteams > 0) {
            message += ` This team has currently ${subteams === 1 ? 'a' : subteams} subteam${subteams > 1 ? 's' : ''}.`
                + `Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned.`;
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: async () => {
                const success = await deleteTeam({teamId});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            },
            onConfirm2: subteams > 0 ? async () => {
                const success = await deleteTeam({teamId, cascade: true});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            } : null,
            confirmLabel: subteams > 0 ? 'Delete only this team' : 'Delete the team',
            confirmLabel2: subteams > 0 ? 'Delete team and subteams' : undefined,
        });
    },[closeTopModal, openModal, refreshData, deleteTeam]);

    const handleTeamsDelete = useCallback((selectedTeams) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: `Are you sure you want to delete ${selectedTeams.size} selected ` +
                `Team${selectedTeams.size > 1 ? 's' : ''}? This action cannot be undone.`,
            onConfirm: async () => {
                const success = await deleteTeams({teamIds: Array.from(selectedTeams)});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            },
        });

    }, [closeTopModal, openModal, refreshData, deleteTeams]);

    const tableStructure = useMemo(() => ({
        pageHeader: {
            title: 'Teams',
            itemName: 'Team',
            allElements: new Set(teams?.map(team => team.id)),
            newItemModal: 'teamNew'
        },
        tableFields: {
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
        },
        hasHeader: true,
        subRowField: 'subteams',
        contextMenuActions: [
            { id: 'select', label: 'Select Team', selectionMode: false, select: 'id'},
            { id: 'edit', label: 'Edit Team', selectionMode: false,
                onClick: (props) => openModal({content: 'teamEdit', contentId: props.id}) },
            { id: 'assign-member', label: 'Edit Members', selectionMode: false,
                onClick: (props) => openModal({content: 'TeamUserAssignment', type: 'dialog', data: props}) },
            { id: 'delete', label: 'Delete Team', selectionMode: false,
                onClick: (props) => handleTeamDelete(props) },
            { id: 'select-all', label: 'Select All', selectionMode: true, setSelected: new Set(teams?.map(team => team.id)) },
            { id: 'select-all-main', label: 'Select Main Teams', selectionMode: true,
                setSelected: new Set(teams?.filter(team => team.parent_team === null).map(team => team.id)) },
            { id: 'clear-selection', label: 'Clear Selection', selectionMode: true,
                setSelected: new Set() },
            { id: 'bulk-assign-member', label: 'Assign Members', selectionMode: true,
                onClick: (selectedTeams) => openModal({content: 'teamUserBulkAssignment', style: {overflow: 'unset'},
                    type: 'dialog', data: teams.filter(team => selectedTeams.has(team.id))}) },
            { id: 'bulk-delete', label: 'Delete Selected', selectionMode: true,
                onClick: (selectedTeams) => handleTeamsDelete(selectedTeams) },
        ],
        }), [handleTeamDelete, handleTeamsDelete, openModal, teams]);

    if (loading) 
        return <Loader />;

    return (
        <Table
            dataSource={teams && teams.filter(team => team.parent_team === null)}
            tableStructure={tableStructure}
            hasSelectableRows={true}
            dataPlaceholder={'No Teams found.'}
        />
    );
};

export default TeamsIndex;