// FRONTEND/components/Teams/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useTeams} from '../../hooks/useResource';
import Details from '../Details';
import Loader from '../Loader';

const TeamDetails = ({ teamId, modal }) => {
    const { team, loading, fetchTeam, deleteTeam } = useTeams();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openDialog, openPopUp, closeTopModal } = useNav();

    useEffect(() => {
        const refresh = refreshTriggers?.team?.data === teamId;

        if (refresh)
            delete refreshTriggers.team;

        if (teamId && (!team || refresh))
            fetchTeam({id: teamId, reload: refresh}).then();

    }, [fetchTeam, team, teamId, refreshTriggers.team]);

    const handleDelete = useCallback(() => {
        let message = `Are you sure you want to delete this role? This action cannot be undone.`

        const membersCount = team.members.length+team.managers.length+team.leaders.length;
        const subteamsCount = team.sub_teams.length;

        if (membersCount > 0)
            message += ` There are currently ${membersCount === 1 ? 'a' : membersCount}
             user${membersCount > 1 ? 's' : ''} assigned to this team.`

        if (subteamsCount > 0)
            message += ` This team has currently ${subteamsCount === 1 ? 'a' : subteamsCount} 
            subteam${subteamsCount > 1 ? 's' : ''}. 
            Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned?`

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteTeam({id: teamId});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            },
            onConfirm2: subteamsCount > 0 ? async () => {
                const success = await deleteTeam({id: teamId, cascade: true});
                if (!success) return;
                refreshData('teams', true);
                closeTopModal();
            } : null,
            confirmLabel: subteamsCount > 0 ? 'Delete only this team' : 'Delete the team',
            confirmLabel2: 'Delete team and subteams',
        });
    }, [team, teamId, openPopUp, deleteTeam, refreshData, closeTopModal]);
    
    const userStructure = useMemo(() => ({
        idField: 'id',
        dataField: ['first_name', 'last_name'],
        onClick: (id) => openDialog({ content: 'userDetails', contentId: id, closeButton: false }),
        suffix: {
            dataField: 'team',
            idField: 'id',
            nameField: 'name',
            condition: 'neq',
            onClick: (id) => openDialog({content: 'teamDetails', contentId: id, closeButton: false }),
        }
    }), [openDialog]);

    const teamStructure = useMemo(() => ({
        idField: 'id',
        dataField: 'name',
        onClick: (id) => {openDialog({ content: 'teamDetails', contentId: id, closeButton: false })}
    }), [openDialog]);

    const header = useMemo(() => ({
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Team ID'
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'teamEdit', contentId: teamId})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [openModal, teamId, handleDelete]);

    const sections = useMemo(() => ({
        0: {
            header: 'Details',
            fields: {
                0: {
                    label: 'Codename',
                    dataType: 'string',
                    dataField: 'code_name'
                },
                1: {
                    label: 'Parent Team',
                    dataType: 'item',
                    dataField: 'parent',
                    hideEmpty: true,
                    item: teamStructure
                },
                2: {
                    label: 'Sub Teams',
                    dataType: 'list',
                    dataField: 'subteams',
                    placeholder: 'No SubTeams assigned.',
                    items: teamStructure,
                    button: {
                        label: 'Add Subteam',
                        onClick: () => openModal({content: 'subteamNew', parentId: teamId})
                    }
                }
            }
        },
        1: {
            header: 'Members',
            fields: {
                0: {
                    type: 'data-group',
                    label: 'Team Managers',
                    dataType: 'list',
                    dataField: 'managers',
                    placeholder: 'No Managers assigned.',
                    items: userStructure
                },
                1: {
                    type: 'data-group',
                    label: 'Team Leaders',
                    dataType: 'list',
                    dataField: 'leaders',
                    placeholder: 'No Leaders assigned.',
                    items: userStructure
                },
                2: {
                    type: 'data-group',
                    label: 'Team Members',
                    dataType: 'list',
                    dataField: 'members',
                    placeholder: 'No Members assigned.',
                    items: userStructure
                }
            }
        }
    }), [openModal, teamId, teamStructure, userStructure]);

    if (loading)
        return <Loader />;

    if (!team)
        return <h1>Team not found!</h1>;

    return <Details header={header} sections={sections} data={team} modal={modal} />;
};

export default TeamDetails;