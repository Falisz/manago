// FRONTEND/hooks/useLeaves.js
import {useCallback, useRef, useState} from 'react';
import axios from 'axios';

const useShifts = () => {
    const [leaves, setLeaves] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);
    const cache = useRef({});

    const fetchLeaves = useCallback( async ({
                                                id = null,
                                                user,
                                                user_scope,
                                                user_scope_id,
                                                date,
                                                start_date,
                                                end_date,
                                                loading = true
                                            } = {}) => {

        setLoading(loading);
        setStatus([]);

        const cacheKey = `leaves-${id || 0}-${start_date}-${end_date}-${user_scope}-${user_scope_id}`;

        let leaves = new Map();

        if (cache.current[cacheKey]) {
            leaves = cache.current[cacheKey];
            setLeaves(leaves);
            loading && setLoading(false);
            return leaves;
        }

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
            setLeaves(leaves);
            loading && setLoading(false);
            return leaves;
        }

        try {
            let url;
            let params = {};

            if (id) {
                url = `/leaves/${id}`;
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

                url = '/leaves?' + new URLSearchParams(params).toString();
            }

            const res = await axios.get(url, { withCredentials: true });

            leaves = res.data;

            cache.current[cacheKey] = leaves;
            setLeaves(leaves);
            loading && setLoading(false);
            return leaves;

        } catch (err) {
            console.error('fetchLeaves error: ', err);
            const message = 'Error occurred while fetching Leave data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

    }, []);

    const fetchLeave = useCallback( async ({leaveId}) => 
        await fetchLeaves({leaveId}), [fetchLeaves]);

    return {
        leaves,
        leave: leaves,
        loading,
        status,
        setLoading,
        setStatus,
        fetchLeave,
        fetchLeaves,
    };
};

export default useShifts;