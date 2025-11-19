// FRONTEND/hooks/useLeaves.js
import {useCallback, useState} from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';

const useLeaves = () => {
    // internal hooks and states
    const { appCache, showPopUp } = useApp();
    const leaveCache = appCache.current.leaves;
    const [leaves, setLeaves] = useState(null);
    const [loading, setLoading] = useState(true);

    // API callbacks
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

        let leaves = new Map();

        if (id && leaveCache.current[id]) {
            leaves = leaveCache.current[id];
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

            if (id)
                leaveCache.current[id] = leaves;

            setLeaves(leaves);
            loading && setLoading(false);
            return leaves;

        } catch (err) {
            console.error('fetchLeaves error: ', err);
            const message = 'Error occurred while fetching Leave data.';
            showPopUp({type: 'error', content: message});
        }

    }, [showPopUp, leaveCache]);

    const fetchLeave = useCallback( async ({leaveId}) => 
        await fetchLeaves({leaveId}), [fetchLeaves]);

    return {
        leaves,
        leave: leaves,
        loading,
        setLoading,
        fetchLeave,
        fetchLeaves,
    };
};

export default useLeaves;