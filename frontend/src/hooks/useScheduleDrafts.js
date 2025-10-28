// FRONTEND/hooks/useScheduleDrafts.js
import { useCallback, useState } from 'react';
import axios from 'axios';

const useScheduleDrafts = () => {
    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, include_shifts, loading = true}) => {

        let scheduleDrafts;
        setLoading(loading);

        try {

            let url;

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            if (include_shifts)
                url += '?include_shifts=true';

            const res = await axios.get(url , { withCredentials: true });

            scheduleDrafts = res.data;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        setScheduleDrafts(scheduleDrafts);
        setLoading(false);
        return scheduleDrafts;
        
    }, []);

    const fetchScheduleDraft = useCallback( async ({scheduleId}) =>
        await fetchScheduleDrafts({scheduleId}), [fetchScheduleDrafts]);

    const saveScheduleDraft = useCallback( async ({scheduleData}) => {
        setStatus([]);
        // Function to save (create, update) schedule drafts - not to publish them.
    }, []);

    const publishScheduleDraft = useCallback( async ({scheduleId, scheduleData, mode}) => {
        // Function to publish schedule drafts - not to update them.
    }, []);

    return {
        scheduleDrafts,
        scheduleDraft: scheduleDrafts,
        loading,
        status,
        setLoading,
        setStatus,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        publishScheduleDraft
    };
};
export default useScheduleDrafts;