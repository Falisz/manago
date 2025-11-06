// FRONTEND/hooks/useShifts.js
import {useCallback, useState, useRef} from 'react';
import axios from 'axios';

const useShifts = () => {
    const [ shifts, setShifts ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ status, setStatus ] = useState([]);
    const cache = useRef({});

    const fetchShifts = useCallback( async ({
                                                id = null,
                                                user,
                                                user_scope,
                                                user_scope_id,
                                                date,
                                                start_date,
                                                end_date,
                                                schedule_id,
                                                job_post,
                                                location,
                                                loading = true
                                            } = {}) => {

        setLoading(loading);
        setStatus([]);

        const cacheKey = `shifts-${id || 0}-${start_date}-${end_date}-${user_scope}-${user_scope_id}`;

        let shifts = new Map();

        if (cache.current[cacheKey]) {
            shifts = cache.current[cacheKey];
            setShifts(shifts);
            loading && setLoading(false);
            return shifts;
        }

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
            setShifts(shifts);
            loading && setLoading(false);
            return shifts;
        }

        try {
            let url;
            let params = {};

            if (id) {
                url = `/shifts/${id}`;
            } else {
                if (user)
                    params.user = user;
                else {
                    if (user_scope)
                        params.user_scope = user_scope;
                    if (user_scope_id)
                        params.user_scope_id = user_scope_id;
                }

                if (date)
                    params.date = date;
                else {
                    if (start_date)
                        params.start_date = start_date;
                    if (end_date)
                        params.end_date = end_date;
                }

                if (schedule_id)
                    params.schedule = schedule_id;

                if (job_post)
                    params.job_post = job_post;

                if (location)
                    params.location = location;

                url = '/shifts?' + new URLSearchParams(params).toString();
            }

            const res = await axios.get(url, { withCredentials: true });

            shifts = res.data;

            cache.current[cacheKey] = shifts;
            setShifts(shifts);
            loading && setLoading(false);
            return shifts;

        } catch (err) {
            console.error('fetchShifts error:', err);
            const message = 'Error occurred while fetching the Shift data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

    }, []);

    const fetchShift = useCallback( async (shiftId) =>
        await fetchShifts({shiftId}), [fetchShifts]);

    return {
        shifts,
        loading,
        status,
        setShifts,
        setLoading,
        setStatus,
        fetchShifts,
        fetchShift,
    };
};

export default useShifts;