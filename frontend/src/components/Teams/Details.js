// FRONTEND/components/Teams/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useTeam from '../../hooks/useTeam';
import { useModals } from '../../contexts/ModalContext';
import '../../assets/styles/Details.css';
import Details from "../Details";

const TeamDetails = ({ teamId }) => {
    const { team, loading, fetchTeam, deleteTeam } = useTeam();
    const { openModal, refreshTriggers, closeTopModal, refreshData } = useModals();

    useEffect(() => {
        if (teamId) {
            fetchTeam(teamId).then();
        }
    }, [teamId, fetchTeam]);

    useEffect(() => {
        if (refreshTriggers?.team?.data === parseInt(teamId)) {
            fetchTeam(teamId, true).then();
        }
    }, [teamId, fetchTeam, refreshTriggers]);

    const handleDelete = async () => {
        let message = `Are you sure you want to delete this role? This action cannot be undone.`

        const membersCount = team.members.length+team.managers.length+team.leaders.length;
        const subteamsCount = team.sub_teams.length;

        if (membersCount > 0) {
            message += ` There are currently ${membersCount === 1 ? 'a' : membersCount}
             user${membersCount > 1 ? 's' : ''} assigned to this team.`
        }
        if (subteamsCount > 0) {
            message += ` This team has currently ${subteamsCount === 1 ? 'a' : subteamsCount} 
            subteam${subteamsCount > 1 ? 's' : ''}. 
            Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned?`
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
            onConfirm2: subteamsCount > 0 ? () => {
                deleteTeam(teamId, true).then();
                refreshData('teams', true);
                closeTopModal();
            } : null,
            confirmLabel: subteamsCount > 0 ? 'Delete only this team' : 'Delete the team',
            confirmLabel2: 'Delete team and subteams',
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!team) {
        return <h1>Team not found!</h1>;
    }

    const userStructure = {
        idField: 'id',
        dataField: ['first_name', 'last_name'],
        onClick: (id) => openModal({ content: 'userDetails', contentId: id, type: 'dialog' }),
        suffix: {
            dataField: 'team',
            idField: 'id',
            nameField: 'name',
            condition: 'neq',
            onClick: (id) => openModal({content: 'teamDetails', contentId: id, type: 'dialog' }),
        }
    };

    const teamStructure = {
        idField: 'id',
        dataField: 'name',
        onClick: (id) => {openModal({ content: 'teamDetails', contentId: id, type: 'dialog' })}
    }

    const detailsStructure = {
        header: {
            type: 'header',
            titlePrefix: {
                dataField: 'id',
                title: 'Team ID',
            },
            title: {
                dataField: ['name'],
            },
            buttons: {
                edit: {
                    className: 'edit',
                    icon: 'edit',
                    title: 'Edit Team',
                    onClick: () => openModal({content: 'teamEdit', contentId: team.id})
                },
                delete: {
                    className: 'delete',
                    icon: 'delete',
                    title: 'Delete Team',
                    onClick: handleDelete
                }
            }
        },
        detailSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Details'
            },
            codeName: {
                type: 'data-group',
                label: 'Codename',
                dataType: 'string',
                dataField: 'code_name'
            },
            parentTeam: {
                type: 'data-group',
                label: 'Parent Team',
                dataType: 'item',
                dataField: 'parent',
                hideEmpty: true,
                item: teamStructure
            },
            subTeams: {
                type: 'data-group',
                label: 'Sub Teams',
                dataType: 'list',
                dataField: 'sub_teams',
                placeholder: 'No Roles assigned.',
                items: teamStructure,
                newItem: {
                    label: 'Add Subteam',
                    onClick: () => openModal({ content: 'subteamNew', parentId: team.id })
                }
            }
        },
        membersSection: {
            type: 'section',
            header: {
                type: 'section-header',
                text: 'Members',
            },
            managers: {
                type: 'data-group',
                label: 'Team Managers',
                dataType: 'list',
                dataField: 'managers',
                placeholder: 'No Managers assigned.',
                items: userStructure
            },
            leaders: {
                type: 'data-group',
                label: 'Team Leaders',
                dataType: 'list',
                dataField: 'leaders',
                placeholder: 'No Leaders assigned.',
                items: userStructure
            },
            members: {
                type: 'data-group',
                label: 'Team Members',
                dataType: 'list',
                dataField: 'members',
                placeholder: 'No Members assigned.',
                items: userStructure
            },
        }
    }

    return <Details
        structure={detailsStructure}
        data={team}
    />
};

export default TeamDetails;