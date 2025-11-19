// FRONTEND/hooks/useTeams.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';
import useNav from '../contexts/NavContext';

const useTeams = () => {
    // internal hooks and states
    const { appCache, showPopUp, refreshData } = useApp();
    const { openModal } = useNav();
    const teamCache = appCache.current.teams;
    const [teams, setTeams] = useState(null);
    const [loading, setLoading] = useState();

    // API callbacks
    const fetchTeams = useCallback(async ({teamId = null, all = false,
                                              loading = true, reload = false, map = false} = {}) => {

        let teams;

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
            showPopUp({type: 'error', content: message});
        }

        setTeams(teams);
        setLoading(false);
        return teams;
        
    }, [teamCache, showPopUp]);


    const fetchTeam = useCallback(async ({teamId, reload} = {}) =>
        await fetchTeams({teamId, reload}), [fetchTeams]);

    const saveTeam = useCallback(async ({teamId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newTeam = !teamId;

        try {
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

            if (!data)
                return null;

            // TODO: Test it out.
            if (data?.message)
                showPopUp({
                    type: 'success',
                    content: data.message,
                    onClick: !teamId ? () => openModal({content: 'teamDetails', 
                        contentId: data.id
                    }) : null
                });

            refreshData('teams', true);
            teamId && refreshData('team', teamId);

            return ( data && data.team ) || null;

        } catch (err) {
            console.error('saveTeam error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the Team data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp, openModal, refreshData]);

    const saveTeamAssignment = useCallback( async ({ teamIds, resource, resourceIds, mode = 'set'}) => {
        if (!teamIds || !resourceIds || !resource)
            return null;

        if (!Array.isArray(teamIds))
            teamIds = Array.from(teamIds);

        if (!Array.isArray(resourceIds))
            resourceIds = Array.from(resourceIds);

        if (!teamIds.length || !resourceIds.length)
            return null;

        try {
            const res = await axios.post(
                '/teams/assignments',
                {teamIds, resource, resourceIds, mode},
                { withCredentials: true }
            );

            // TODO: Test this out.
            console.log(res);

            refreshData('teams', true);

            return true;

        } catch (err) {
            console.error('Error saving new team assignments:', err);

            const message = 'Error occurred while saving new Team assignments. ' + err.response?.data?.message
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp, refreshData]);

    const deleteTeams = useCallback( async ({teamId, teamIds, cascade = false} = {}) => {

        const batchMode = Array.isArray(teamIds) && teamIds.length > 0;

        try {
            setLoading(true);

            let res;

            if (batchMode)
                res = await axios.delete(
                    `/teams${cascade ? '?cascade=true' : ''}`,
                    {data: {id: Array.from(teamIds)}},
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
                showPopUp({type: 'warning', content: data.warning});

            if (data.message)
                showPopUp({type: 'success', content: data.message});

            if (batchMode)
                teamIds.forEach(teamId => delete teamCache[teamId]);
            else
                delete teamCache[teamId];
            
            refreshData('teams', true);

            return true;

        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Team' + (batchMode ? 's' : '') + '. Please try again.';
            showPopUp({type: 'error', content: message});

            return null;
        } finally {
            setLoading(false);
        }
    }, [teamCache, showPopUp, refreshData]);

    const deleteTeam = useCallback(async ({teamId, cascade} = {}) =>
        await deleteTeams({teamId, cascade}), [deleteTeams]);

    return {
        teams,
        team: teams,
        loading,
        setLoading,
        fetchTeams,
        fetchTeam,
        saveTeam,
        saveTeamAssignment,
        deleteTeams,
        deleteTeam
    };
};

export default useTeams;