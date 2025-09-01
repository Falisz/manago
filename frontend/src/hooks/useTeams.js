//FRONTEND:hooks/useTeams.js
import {useCallback, useState} from "react";
import axios from "axios";

const useTeams = () => {
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState(null);
    const [error, setError] = useState(null);

    const fetchTeams = useCallback(async (loading=true) => {
        try {
            setLoading(loading);
            setError(null);

            const response = await axios.get('/teams', { withCredentials: true });
            setTeams(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams. Please try again later.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { teams, loading, error, fetchTeams};

};

export default useTeams;