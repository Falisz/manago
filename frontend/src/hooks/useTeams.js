// FRONTEND/hooks/useTeams.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useAppState from '../contexts/AppStateContext';

const useTeams = () => {
    const [teams, setTeams] = useState(null);
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState();
    const { appCache } = useAppState();
    const teamCache = appCache.current.teams;

    const fetchTeams = useCallback(async ({teamId = null, all = false,
                                              loading = true, reload = false, map = false} = {}) => {

        let teams;
        setStatus([]);

        if (teamId && !reload && teamCache[teamId]) {
            setTeams(teamCache[teamId]);
            setLoading(false);
            return teamCache[teamId];
        }

        try {
            setLoading(loading);

            let url = '/teams';

            if (teamId) {
                url = `/teams/${teamId}`;
            } else if (all) {
                url = '/teams?all=true';
            }

            const res = await axios.get(url, { withCredentials: true });

            if (teamId)
                teamCache[teamId] = res.data;

            teams = res.data;

            if (map) {
                if (!Array.isArray(teams))
                    teams = [teams];
                teams = new Map(
                    teams.map(team => [team.id, team])
                );
            }

        } catch (err) {
            console.error('fetchTeams error:', err);

            const message = 'Error occurred while fetching the Team data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        setTeams(teams);
        setLoading(false);
        return teams;
        
    }, [teamCache]);


    const fetchTeam = useCallback(async ({teamId, reload} = {}) =>
        await fetchTeams({teamId, reload}), [fetchTeams]);

    const saveTeam = useCallback(async ({teamId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newTeam = !teamId;

        try {
            setStatus([]);

            let res;

            if (newTeam)
                res = await axios.post(
                    '/teams',
                    formData,
                    { withCredentials: true }
                );

            else
                res = await axios.put(
                    `/teams/${teamId}`,
                    formData,
                    { withCredentials: true }
                );

            const { data } = res;

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            return ( data && data.team ) || null;

        } catch (err) {
            console.error('saveTeam error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the Team data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        }
    }, []);

    // TODO: To refactor
    const saveTeamAssignment = useCallback( async (resource, resourceIds, teamIds, role=2, mode='set') => {
        try {
            setStatus([]);

            return await axios.post('/teams/assignments', {resource, resourceIds, role, teamIds, mode}, { withCredentials: true });

        } catch (err) {
            console.error('Error saving new team assignments:', err);

            const message = 'Error occurred while saving new Team assignments. ' + err.response?.data?.message
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        }
    }, []);

    const deleteTeams = useCallback( async ({teamId, teamIds, cascade = false} = {}) => {

        const batchMode = Array.isArray(teamIds) && teamIds.length > 0;

        try {
            setLoading(true);
            setStatus([]);

            let res;

            if (batchMode)
                res = await axios.delete(
                    `/teams${cascade ? '?cascade=true' : ''}`,
                    {data: {teamIds: Array.from(teamIds)}},
                    { withCredentials: true }
                );

            else
                res = await axios.delete(
                    `/teams/${teamId}${cascade ? '?cascade=true' : ''}`,
                    { withCredentials: true }
                );

            const { data } = res;

            if (batchMode && data.ids)
                teamIds = data.ids;

            if (data.warning)
                setStatus(prev => [...prev, {status: 'warning', message: data.warning}]);

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            if (batchMode)
                teamIds.forEach(teamId => delete teamCache[teamId]);
            else
                delete teamCache[teamId];

            return true;

        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Team' + (batchMode ? 's' : '') + '. Please try again.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        } finally {
            setLoading(false);
        }
    }, [teamCache]);

    const deleteTeam = useCallback(async ({teamId, cascade} = {}) =>
        await deleteTeams({teamId, cascade}), [deleteTeams]);

    return {
        teams,
        team: teams,
        loading,
        status, // 4 kinds: info, success, warning, error
        setLoading,
        setStatus,
        fetchTeams,
        fetchTeam,
        saveTeam,
        saveTeamAssignment,
        deleteTeams,
        deleteTeam
    };
};

export default useTeams;