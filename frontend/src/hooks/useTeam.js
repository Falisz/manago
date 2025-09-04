// FRONTEND/hooks/useTeam.js
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

const useTeam = () => {
    // All teams related states
    const [teams, setTeams] = useState(null);
    const [teamsLoading, setTeamsLoading] = useState(true);

    // All teams related callbacks
    const fetchTeams = useCallback(async (loading=true) => {
        try {
            setTeamsLoading(loading);
            const response = await axios.get('/teams', { withCredentials: true });
            setTeams(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching teams:', err);
            return null;
        } finally {
            setTeamsLoading(false);
        }
    }, []);

    // Single team related states
    const [team, setTeam] = useState(null);
    const teamCacheRef = useRef({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Single team related callbacks
    const fetchTeam = useCallback(async (teamId, reload = false) => {
        if (!teamId) return null;

        if (teamCacheRef.current[teamId] && !reload) {
            setTeam(teamCacheRef.current[teamId]);
            setLoading(false);
            setError(null);
            setSuccess(null);
            return teamCacheRef.current[teamId];
        }
        
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            let teamData;
            let res = await axios.get(`/teams/${teamId}`, { withCredentials: true });
            if (res.data) {
                teamData = res.data;
                setTeam(teamData);
                teamCacheRef.current[teamId] = teamData;
                return teamData;
            } else {
                setError(`Team #${teamId} not found!`);
                return null;
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setError('Error occurred while fetching user.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        teams,
        teamsLoading,
        fetchTeams,
        team,
        loading,
        error,
        success,
        setLoading,
        fetchTeam
    };
};

export default useTeam;