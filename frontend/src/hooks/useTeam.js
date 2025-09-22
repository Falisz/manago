// FRONTEND/hooks/useTeam.js
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

const useTeam = () => {
    // All teams related states
    const [teams, setTeams] = useState(null);
    const [teamsLoading, setTeamsLoading] = useState(true);

    // All teams related callbacks
    const fetchTeams = useCallback(async (loading=true, all=false) => {
        try {
            setTeamsLoading(loading);
            const res = await axios.get(`/teams${all ? '?all=true' : ''}`, { withCredentials: true });
            setTeams(res.data);
            return res.data;
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
    const [warning, setWarning] = useState(null);
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
            let res = await axios.get(`/teams/${teamId}`, { withCredentials: true });
            setTeam(res.data);
            teamCacheRef.current[teamId] = res.data;
            return res.data;
        } catch (err) {
            if (err.status === 404) {
                setError('Team not found.');
            } else {
                setError('Error fetching the team.');
                console.error('Error fetching the team:', err);
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveTeam = useCallback(async (formData, teamId = null) => {
        const newTeam = !teamId;
        try {
            setError(null);
            setSuccess(null);
            let res;
            if (newTeam) {
                res = await axios.post('/teams', formData, { withCredentials: true });
                teamId = parseInt(res.data.team?.id);
            } else {
                await axios.put(`/teams/${teamId}`, formData, { withCredentials: true });
            }
            setSuccess(`Team ${newTeam? 'created' : 'updated'} successfully.`);

            return fetchTeam(teamId, true);
        } catch (err) {
            console.error('Error saving the team:', err);
            setWarning('Failed to save the team. '
                + (err.response?.data?.message || 'Please Try again later.'));
            return null;
        }
    }, [fetchTeam]);

    const saveTeamAssignment = useCallback( async (resource, resourceIds, teamIds, mode='set') => {
        try {
            setError(null);
            setWarning(null);
            setSuccess(null);

            await axios.post('/teams/assignments', {resource, resourceIds, teamIds, mode}, { withCredentials: true });

        } catch (err) {
            console.error('Error saving new team assignments:', err);
            setWarning('Error occurred while saving new team assignments. ' + err.response?.data?.message);
            return null;
        }
    }, []);

    const deleteTeam = useCallback( async (roleId, cascade = false) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const res = await axios.delete(
                `/teams/${roleId}${cascade ? '?cascade=true' : ''}`,
                { withCredentials: true }
            );
            setSuccess(res.data.message);
            setTeam(null);
            delete teamCacheRef.current[roleId];
            return true;
        } catch (err) {
            console.error('Error deleting the team:', err);
            setError('Failed to delete the team. Please try again.');
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
        setLoading,
        error,
        warning,
        success,
        fetchTeam,
        saveTeam,
        saveTeamAssignment,
        deleteTeam
    };
};

export default useTeam;