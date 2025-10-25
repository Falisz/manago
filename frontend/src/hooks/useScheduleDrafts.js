// FRONTEND/hooks/useScheduleDrafts.js
import { useCallback, useState } from 'react';
import axios from 'axios';

const useScheduleDrafts = () => {

    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchScheduleDrafts = useCallback(async (loading=true) => {
        try {
            setLoading(loading);
            const res = await axios.get('/schedules', { withCredentials: true });
            setScheduleDrafts(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching Schedule Drafts:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        scheduleDrafts,
        loading,
        fetchScheduleDrafts
    };
};
export default useScheduleDrafts;