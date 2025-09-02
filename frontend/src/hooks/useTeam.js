//FRONTEND:hooks/useTeam.js
import {useCallback, useRef, useState} from "react";
import axios from "axios";

const useTeam = () => {
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState(null);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const teamCacheRef = useRef({});

    const fetchTeam = useCallback(async (teamId, reload = false) => {
        if (!teamId) return null;

        if (teamCacheRef.current[teamId] && !reload) {
            setTeam(teamCacheRef.current[teamId]);
            setLoading(false);
            setError(null);
            setWarning(null);
            setSuccess(null);
            return teamCacheRef.current[teamId];
        }
        
        try {
            setLoading(true);
            setError(null);
            setWarning(null);
            setSuccess(null);

            let teamData;
            let res = await axios.get(`/team/${teamId}`, { withCredentials: true });
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

    return { team, loading, error, warning, success, setLoading, fetchTeam };
};

export default useTeam;