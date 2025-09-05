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
            const res = await axios.get('/teams', { withCredentials: true });
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
            setError(err.response?.data?.message || 'Failed to save the team. Please try again.');
            return null;
        }
    }, [fetchTeam]);

    const deleteTeam = useCallback( async (roleId) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const res = await axios.delete(`/teams/${roleId}`, { withCredentials: true });
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
        success,
        fetchTeam,
        saveTeam,
        deleteTeam
    };
};

export default useTeam;