// FRONTEND/components/Teams/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useTeam from '../../hooks/useTeam';
import { useModals } from '../../contexts/ModalContext';

const TeamDetails = ({ teamId }) => {
    const { team, loading, fetchTeam } = useTeam();
    const { openModal, refreshTriggers } = useModals();

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

    if (loading) {
        return <Loader />;
    }

    if (!team) {
        return <h1>Team not found!</h1>;
    }

    console.log(team);

    return (
        <div className='team-detail'>
            <div className='team-detail-header'>
                <div className={'team-id'} title={'Team ID'}>#{team.id}</div>
                <div className={'team-name'} title={'Team Name'}>{team.name}</div>
            </div>
            <div className='team-detail-group'>
                <div className={'team-detail-label'}>Team details</div>
                <div className={'team-detail-row team-codename'} title={'Team codename'}><label>Code name</label> {team.code_name}</div>
                {team.parent_team &&
                    <div className={'team-detail-row team-parent'} title={'Team codename'}><label>Parent Team</label>
                        <span
                            className={'team-detail-link'}
                            onClick={() => openModal({ content: 'teamDetails', data: { id: team.parent_team.id } })}
                        >
                            {team.parent_team.name}
                        </span>
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
                {team.team_leaders && team.team_leaders?.length > 0 &&
                    <div className={'team-detail-row team-leaders'} title={'Team leaders'}><label>Team Leader{ team.team_leaders?.length > 1 && "s" }</label>
                        {team.team_leaders.map((leader) => (
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