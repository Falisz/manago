// FRONTEND/hooks/useJobPosts.js
import {useCallback, useState} from 'react';
import axios from 'axios';

const useJobPosts = () => {
    const [jobPosts, setJobPosts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const fetchJobPosts = useCallback( async ({
                                                id = null,
                                                include_shifts = false,
                                                loading = true
                                            } = {}) => {

        setLoading(loading);
        setStatus([]);

        try {
            let jobPosts;
            let url = '/job-posts';
            let params = {};

            if (id) {
                url = `/job-posts/${id}`;
            } else {
                if (include_shifts)
                    params.include_shifts = include_shifts;

                if (Object.entries(params).length > 0)
                    url = '/job-posts?' + new URLSearchParams(params).toString();
            }

            const res = await axios.get(url, { withCredentials: true });

            jobPosts = res.data;

            setJobPosts(jobPosts);
            loading && setLoading(false);
            return jobPosts;

        } catch (err) {
            console.error('fetchJobPosts error: ', err);
            const message = 'Error occurred while fetching Job Post data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

    }, []);

    const fetchJobPost = useCallback( async (id) =>
        await fetchJobPosts({id}), [fetchJobPosts]);

    return {
        jobPosts,
        jobPost: jobPosts,
        loading,
        status,
        setLoading,
        setStatus,
        fetchJobPosts,
        fetchJobPost
    };
};

export default useJobPosts;