// FRONTEND/components/Teams/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useTeam from '../../hooks/useTeam';
import { useModals } from '../../contexts/ModalContext';
import '../../assets/styles/Details.css';
import Icon from "../Icon";

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

    const handleDelete = async (users = 0, subteams = 0) => {
        let message = `Are you sure you want to delete this role? This action cannot be undone.`

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

    if (loading) {
        return <Loader />;
    }

    if (!team) {
        return <h1>Team not found!</h1>;
    }

    return (
        <div className='detail-content'>
            <div className='detail-header'>
                <div className={'detail-title-prefix team-id'} title={'Team ID'}>#{team.id}</div>
                <div className={'detail-title team-name'} title={'Team Name'}>{team.name}</div>
                <button
                    className={'action-button edit-button'}
                    onClick={() => {openModal({content: 'teamEdit', contentId: team.id })}}
                    title={'Edit Team details'}
                >
                    <Icon i={'edit'} />
                </button>
                <button
                    className={'action-button delete-button'}
                    onClick={() => handleDelete(
                        (team.members.length+team.managers.length+team.leaders.length),
                        (team.sub_teams.length)
                    )}
                    title={'Delete the Team'}
                >
                    <Icon i={'delete'} />
                </button>
            </div>
            <div className='detail-section'>
                <div className={'detail-subheader'}>Team details</div>
                <div className={'detail-row team-codename'} title={'Team codename'}><label>Code name</label> {team.code_name}</div>
                {team.parent &&
                    <div className={'detail-row team-parent'} title={'Team codename'}><label>Parent Team</label>
                        <span
                            className={'detail-link'}
                            onClick={() => openModal({ content: 'teamDetails', contentId: team.parent.id, type: 'dialog' })}
                        >
                            {team.parent.name}
                        </span>
                    </div>
                }
                {team.sub_teams && team.sub_teams.length > 0 &&
                    <div className={'detail-row team-parent'} title={'Team\'s subteams'}><label>Subteams</label>
                        {team.sub_teams.map((subteam) => (
                            <div
                                key={subteam.id}
                                className={'detail-row'}
                            >
                                <span
                                    key={subteam.id}
                                    className={'detail-link'}
                                    onClick={() => openModal({ content: 'teamDetails', contentId: subteam.id, type: 'dialog' })}
                                >
                                    {subteam.name}
                                </span>
                            </div>
                            )
                        )}
                    </div>
                }
            </div>
            {team.managers && team.managers?.length > 0 &&
                <div className='detail-section'>
                    <div
                        className={'detail-subheader'}
                        title={'Team managers'}
                    >
                        Team Manager{ team.managers?.length > 1 && "s" }
                    </div>
                    {team.managers.map((manager) => (
                        <div
                            key={manager.id}
                            className={'detail-row linear'}
                        >
                            <span
                                key={manager.id}
                                className={'detail-link'}
                                onClick={() => openModal({ content: 'userDetails', contentId: manager.id, type: 'dialog' })}
                            >
                                {manager.first_name} {manager.last_name}
                            </span>
                            {manager.team.id !== teamId && <small>&nbsp;&nbsp;
                                (manager of whole {<span
                                    key={manager.id}
                                    className={'detail-link'}
                                    onClick={() => openModal({ content: 'teamDetails', contentId: manager.team.id, type: 'dialog' })}
                                >
                                    {manager.team.name}
                                </span>})
                            </small>}
                        </div>
                    ))}
                </div>
            }
            {team.leaders && team.leaders?.length > 0 &&
                <div className='detail-section'>
                    <div
                        className={'detail-subheader'}
                        title={'Team leaders'}
                    >
                        Team Leader{ team.leaders?.length > 1 && "s" }
                    </div>
                    {team.leaders.map((leader) => (
                        <div
                            key={leader.id}
                            className={'detail-row linear'}
                        >
                            <span
                                key={leader.id}
                                className={'detail-link'}
                                onClick={() => openModal({ content: 'userDetails', contentId: leader.id, type: 'dialog' })}
                            >
                                {leader.first_name} {leader.last_name}
                            </span>
                            {leader.team.id !== teamId && <small>&nbsp;&nbsp;
                                ({<span
                                    key={leader.id}
                                    className={'detail-link'}
                                    onClick={() => openModal({ content: 'teamDetails', contentId: leader.team.id, type: 'dialog' })}
                                >
                                    {leader.team.name}
                                </span>} sub-team)
                            </small>}
                        </div>
                    ))}
                </div>
            }
            <div className='detail-section'>
                <div
                    className={'detail-subheader'}
                    title={'Team Members'}
                >
                    Team Member{ team.members?.length > 1 && "s" }
                </div>
                {team.members.map((member) => (
                    <div
                        key={member.id}
                        className={'detail-row linear'}
                    >
                        <span
                            key={member.id}
                            className={'detail-link'}
                            onClick={() => openModal({ content: 'userDetails', contentId: member.id, type: 'dialog' })}
                        >
                            {member.first_name} {member.last_name}
                        </span>
                        {member.team.id !== teamId && <small>&nbsp;&nbsp;
                            ({<span
                                key={member.id}
                                className={'detail-link'}
                                onClick={() => openModal({ content: 'teamDetails', contentId: member.team.id, type: 'dialog' })}
                            >
                                    {member.team.name}
                            </span>} sub-team)
                        </small>
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamDetails;