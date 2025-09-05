// FRONTEND/components/Teams/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useTeam from '../../hooks/useTeam';
import { useModals } from '../../contexts/ModalContext';

const TeamDetails = ({ teamId }) => {
    const { team, loading, fetchTeam } = useTeam();
    const { openModal, refreshTriggers, closeTopModal } = useModals();

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
        if (subteams > 0) {
            message += ` This team has currently ${subteams === 1 ? 'a' : subteams} subteam${subteams > 1 ? 's' : ''}.`
        }
        if (users > 0) {
            message += ` There are currently ${users === 1 ? 'a' : users} user${users > 1 ? 's' : ''} assigned to this team.`
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: () => {
                console.log('Deleting team not implemented yet.');
                // deleteTeam(teamId).then();
                // refreshData('teams', true);
                closeTopModal();
            },
            onConfirm2: subteams > 0 ? () => {
                console.log('Deleting team and subteams not implemented yet.');
                // deleteTeam(teamId, true).then();
                // refreshData('teams', true);
                closeTopModal();
            } : null,
            confirmLabel: 'Delete the team',
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
        <div className='team-detail'>
            <div className='team-detail-header'>
                <div className={'team-id'} title={'Team ID'}>#{team.id}</div>
                <div className={'team-name'} title={'Team Name'}>{team.name}</div>
                <button
                    className={'action-button edit-button'}
                    onClick={() => {openModal({content: 'teamEdit', data: { id: team.id}})}}
                    title={'Edit Team details'}
                >
                    <i className='material-icons'>edit</i>
                </button>
                <button
                    className={'action-button delete-button'}
                    onClick={() => handleDelete(
                        (team.members.length+team.managers.length+team.leaders.length),
                        (team.sub_teams.length)
                    )}
                    title={'Delete the Team'}
                >
                    <i className='material-icons'>delete</i>
                </button>
            </div>
            <div className='team-detail-group'>
                <div className={'team-detail-label'}>Team details</div>
                <div className={'team-detail-row team-codename'} title={'Team codename'}><label>Code name</label> {team.code_name}</div>
                {team.parent &&
                    <div className={'team-detail-row team-parent'} title={'Team codename'}><label>Parent Team</label>
                        <span
                            className={'team-detail-link'}
                            onClick={() => openModal({ content: 'teamDetails', data: { id: team.parent.id } })}
                        >
                            {team.parent.name}
                        </span>
                    </div>
                }
                {team.sub_teams && team.sub_teams.length > 0 &&
                    <div className={'team-detail-row team-parent'} title={'Team codename'}><label>Subteams</label>
                        {team.sub_teams.map((subteam) => (
                            <div
                                key={subteam.id}
                                className={'subteam'}
                            >
                                <span
                                    key={subteam.id}
                                    className={'team-detail-link'}
                                    onClick={() => openModal({ content: 'teamDetails', data: { id: subteam.id } })}
                                >
                                    {subteam.name}
                                </span>
                            </div>
                            )
                        )}
                    </div>
                }
            </div>
            <div className='team-detail-group'>
                <div className={'team-detail-label'}>Team members</div>
                {team.managers && team.managers?.length > 0 &&
                    <div className={'team-detail-row team-managers'} title={'Team managers'}><label>Team Manager{ team.managers?.length > 1 && "s" }</label>
                        {team.managers.map((manager) => (
                            <div
                                key={manager.id}
                                className={'team-member'}
                            >
                                <span
                                    key={manager.id}
                                    className={'team-detail-link'}
                                    onClick={() => openModal({ content: 'userDetails', data: { id: manager.id } })}
                                >
                                    {manager.first_name} {manager.last_name}
                                </span>
                                {manager.team.id !== teamId && <small>&nbsp;&nbsp;
                                    (manager of whole {<span
                                        key={manager.id}
                                        className={'team-detail-link'}
                                        onClick={() => openModal({ content: 'teamDetails', data: { id: manager.team.id } })}
                                    >
                                        {manager.team.name}
                                    </span>})
                                </small>}
                            </div>
                        ))}
                    </div>
                }
                {team.leaders && team.leaders?.length > 0 &&
                    <div className={'team-detail-row team-leaders'} title={'Team leaders'}><label>Team Leader{ team.leaders?.length > 1 && "s" }</label>
                        {team.leaders.map((leader) => (
                            <div
                                key={leader.id}
                                className={'team-member'}
                            >
                                <span
                                    key={leader.id}
                                    className={'team-detail-link'}
                                    onClick={() => openModal({ content: 'userDetails', data: { id: leader.id } })}
                                >
                                    {leader.first_name} {leader.last_name}
                                </span>
                                {leader.team.id !== teamId && <small>&nbsp;&nbsp;
                                    ({<span
                                        key={leader.id}
                                        className={'team-detail-link'}
                                        onClick={() => openModal({ content: 'teamDetails', data: { id: leader.team.id } })}
                                    >
                                        {leader.team.name}
                                    </span>} sub-team)
                                </small>}
                            </div>
                        ))}
                    </div>
                }
                <div className={'team-detail-row team-members'} title={'Team members'}><label>Team Members</label>
                    {team.members.map((member) => (
                        <div
                            key={member.id}
                            className={'team-member'}
                        >
                            <span
                                key={member.id}
                                className={'team-detail-link'}
                                onClick={() => openModal({ content: 'userDetails', data: { id: member.id } })}
                            >
                                {member.first_name} {member.last_name}
                            </span>
                            {member.team.id !== teamId && <small>&nbsp;&nbsp;
                                ({<span
                                    key={member.id}
                                    className={'team-detail-link'}
                                    onClick={() => openModal({ content: 'teamDetails', data: { id: member.team.id } })}
                                >
                                        {member.team.name}
                                </span>} sub-team)
                            </small>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamDetails;