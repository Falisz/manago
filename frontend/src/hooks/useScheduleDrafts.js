// FRONTEND/hooks/useScheduleDrafts.js
import { useCallback, useState } from 'react';
import axios from 'axios';

const useScheduleDrafts = () => {
    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, include_shifts, loading = true}) => {
        try {
            setLoading(loading);

            let url;

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            if (include_shifts)
                url += '?include_shifts=true';

            const res = await axios.get(url , { withCredentials: true });

            const scheduleDrafts = res.data;

            setScheduleDrafts(scheduleDrafts);
            return scheduleDrafts;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        scheduleDrafts,
        loading,
        status,
        setLoading,
        setStatus,
        fetchScheduleDrafts
    };
};
export default useScheduleDrafts;