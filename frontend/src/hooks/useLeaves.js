// FRONTEND/hooks/useLeaves.js
import { useCallback, useState } from 'react';
import axios from "axios";
import {formatDate} from "../utils/dates";

const useShifts = () => {
    const [leaves, setLeaves] = useState(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);

    const fetchLeaves = useCallback( async ({leaveId = null, users = null, date, start_date, end_date,
                                                loading = true} = {}) => {

        try {
            setLoading(loading);
            setSuccess(null);
            setWarning(null);
            setError(null);

            let url;
            let params = {};
            let payload = {};
            const batchMode = (Array.isArray(users) && users.length > 0) || (Array.isArray(date) && date.length > 0);

            if (leaveId)
                url = `/leaves/${leaveId}`;

            else if (batchMode) {
                url = '/leaves/batch';

                if (users)
                    payload.users = users;

                if (date)
                    payload.dates = date;

                else {
                    if (start_date)
                        payload.start_date = start_date;
                    if (end_date)
                        payload.end_date = new Date(formatDate(end_date) + 'T23:59:59.999Z');
                }

            } else {
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

            const res = await axios[batchMode ? 'post' : 'get'](
                url, batchMode ? payload : null, { withCredentials: true }
            );

            const leaves = res.data;

            setLeaves(leaves);

            return leaves;

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);
        }

    }, []);

    const fetchLeave = useCallback( async (leaveId) => await fetchLeaves({leaveId}), [fetchLeaves])

    return {
        leaves,
        loading,
        success,
        warning,
        error,
        fetchLeave,
        fetchLeaves,
    };
};

export default useShifts;