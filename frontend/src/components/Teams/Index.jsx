// FRONTEND/components/Teams/Index.js
import React, { useEffect, useCallback, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useTeams} from '../../hooks/useResource';
import Loader from '../Loader';
import Table from '../Table';

const TeamsIndex = () => {
    const { refreshTriggers, refreshData } = useApp();
    const { openModal, openPopUp, closeTopModal } = useNav();
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
                + 'Do you want to delete all of its subteams too, or only the main team' +
                ' - keeping other SubTeams orphaned.';
        }
        openPopUp({
            content: 'confirm',
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
    },[closeTopModal, openPopUp, refreshData, deleteTeam]);

    const handleTeamsDelete = useCallback((selectedTeams) => {
        openPopUp({
            content: 'confirm',
            message: `Are you sure you want to delete ${selectedTeams.size} selected ` +
                `Team${selectedTeams.size > 1 ? 's' : ''}? This action cannot be undone.`,
            onConfirm: async () => {
                const success = await deleteTeams({teamIds: Array.from(selectedTeams)});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            },
        });

    }, [closeTopModal, openPopUp, refreshData, deleteTeams]);

    const header = useMemo(() => ({
        title: 'Teams',
        itemName: 'Team',
        allElements: new Set(teams?.map(team => team.id)),
        newItemModal: 'teamNew'
    }), [teams]);

    const fields = useMemo(() => ({
        0: {
            label: 'Name',
            name: 'name',
            type: 'string',
            openModal: 'teamDetails'
        },
        1: {
            label: 'Managers',
            name: 'managers',
            type: 'list',
            openModal: 'userDetails'
        },
        2: {
            label: 'Leaders',
            name: 'leaders',
            type: 'list',
            openModal: 'userDetails'
        },
        3: {
            label: 'Members',
            name: 'members',
            type: 'number',
            value: (data) => data.members?.length || 0,
            style: {maxWidth: '100px'}
        }
        }), []);

    const contextMenuActions = useMemo(() => ([
        { 
            id: 'select', 
            label: 'Select Team', 
            selectionMode: false, 
            select: 'id'
        },
        { 
            id: 'edit', 
            label: 'Edit Team', 
            selectionMode: false,
            onClick: (props) => openModal({content: 'teamEdit', contentId: props.id}) 
        },
        { 
            id: 'assign-member', 
            label: 'Edit Members', 
            selectionMode: false,
            onClick: (props) => openModal({content: 'TeamUserAssignment', type: 'dialog', data: props}) 
        },
        { 
            id: 'delete', 
            label: 'Delete Team', 
            selectionMode: false,
            onClick: (props) => handleTeamDelete(props) 
        },
        { 
            id: 'select-all', 
            label: 'Select All', 
            selectionMode: true, 
            shortcut: 'Ctrl + Z',
            setSelected: new Set(teams?.map(team => team.id)) 
        },
        { 
            id: 'select-all-main', 
            label: 'Select Main Teams', 
            selectionMode: true,
            setSelected: new Set(teams?.filter(team => team.parent_team === null).map(team => team.id)) 
        },
        { 
            id: 'clear-selection', 
            label: 'Clear Selection', 
            selectionMode: true,
            setSelected: new Set() 
        },
        { 
            id: 'bulk-assign-member', 
            label: 'Assign Members', 
            selectionMode: true,
            onClick: (selectedTeams) => openModal({
                content: 'teamUserBulkAssignment', 
                style: {overflow: 'unset'},
                type: 'dialog', 
                data: teams.filter(team => selectedTeams.has(team.id))
            }) 
        },
        { 
            id: 'bulk-delete', 
            label: 'Delete Selected', 
            selectionMode: true,
            onClick: (selectedTeams) => handleTeamsDelete(selectedTeams) 
        },
    ]), [openModal, handleTeamDelete, handleTeamsDelete, teams]);

    if (loading) 
        return <Loader />;

    return (
        <Table
            data={teams && teams.filter(team => team.parent_team === null)}
            header={header}
            fields={fields}
            subRowFields={'subteams'}
            columnHeaders={true}
            sortable={true}
            searchable={true}
            contextMenuActions={contextMenuActions}
            selectableRows={true}
            dataPlaceholder={'No Teams found.'}
        />
    );
};

export default TeamsIndex;