//FRONTEND:hooks/useManagers.js
import {useCallback, useState} from "react";
import axios from "axios";

const useManagers = () => {
    const [loading, setLoading] = useState(true);
    const [managers, setManagers] = useState(null);
    const [error, setError] = useState(null);

    const fetchManagers = useCallback(async (loading=true) => {
        try {
            setLoading(loading);
            setError(null);
            const response = await axios.get('/users/managers', { withCredentials: true });
            setManagers(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching managers:', err);
            setError('Failed to load managers. Please try again later.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { managers, loading, error, fetchManagers};

};

export default useManagers;