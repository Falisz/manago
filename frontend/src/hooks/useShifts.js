// FRONTEND/hooks/useSchedule.js
import { useCallback, useState } from 'react';
import axios from "axios";
import {formatDate} from "../utils/dates";

const useShifts = () => {
    const [shifts, setShifts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);

    const fetchShifts = useCallback( async ({shiftId = null, users = null, date, start_date, end_date, schedule,
                                                job_post, location, loading = true} = {}) => {

        try {
            setLoading(loading);
            setSuccess(null);
            setWarning(null);
            setError(null);

            let url;
            let params = {};
            let payload = {};
            const batchMode = [users, date, schedule, job_post, location]
                .some(param => param != null && Array.isArray(param) && param.length > 0);

            if (shiftId)
                url = `/shifts/${shiftId}`;

            else if (batchMode) {
                url = '/shifts/batch';

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

                if (schedule)
                    payload.schedules = schedule;

                if (job_post)
                    payload.job_posts = job_post;

                if (location)
                    payload.locations = location;

            } else {
                if (date)
                    params.date = date;

                else {
                    if (start_date)
                        params.start_date = start_date;
                    if (end_date)
                        params.end_date = end_date;
                }

                if (schedule)
                    params.schedule = schedule;

                if (job_post)
                    params.job_post = job_post;

                if (location)
                    params.location = location;

                url = '/shifts?' + new URLSearchParams(params).toString();

            }

            const res = await axios[batchMode ? 'post' : 'get'](url, batchMode ? payload : null, { withCredentials: true });

            const shifts = res.data;

            setShifts(shifts);

            return shifts;

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);
        }

    }, []);

    const fetchShift = useCallback( async (shiftId) => await fetchShifts({shiftId}), [fetchShifts])

    return {
        shifts,
        loading,
        success,
        warning,
        error,
        fetchShift,
        fetchShifts,

    };
};

export default useShifts;