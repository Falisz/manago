// FRONTEND/components/Teams/Details.js
import React, {useEffect} from 'react';
import Loader from '../Loader';
import useTeam from '../../hooks/useTeam';
import { useModals } from '../../contexts/ModalContext';

const TeamDetails = ({ teamId }) => {
    const { team, loading, fetchTeam } = useTeam();
    const { refreshTriggers } = useModals();

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

    return (
        <div className='team-detail'>
            <div className='team-detail-header'>
                <div className={'team-id'} title={'Team ID'}>#{team.id}</div>
                <div className={'team-name'} title={'Team Name'}>{team.name}</div>
            </div>
        </div>
    );
};

export default TeamDetails;