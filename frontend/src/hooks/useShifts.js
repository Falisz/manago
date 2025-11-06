// FRONTEND/hooks/useShifts.js
import {useCallback, useState, useRef} from 'react';
import axios from 'axios';

const useShifts = () => {
    const [ shifts, setShifts ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ status, setStatus ] = useState([]);
    const shiftsCache = useRef({});

    const mapShiftsToDates = useCallback( (shifts) => {
        return shifts.reduce((map, shift) => {
            const date = shift.date;

            if (!map.has(date))
                map.set(date, []);

            map.get(date).push(shift);

            return map;
        }, new Map());
    }, []);

    const mapShiftsToUsers = useCallback( (shifts, users, leaves) => {
        const userShifts = new Map(users.map(user => [user.id, user]));

        userShifts.forEach((user, userId) => {
            user.shifts = shifts
                .filter(shift => shift.user.id === userId)
                .map(shift => ({...shift, user: shift.user.id}));
            user.shifts = mapShiftsToDates(user.shifts);

            if (leaves)
                user.leaves = leaves
                    .filter(leave => leave.user.id === userId)
                    .map(leave => ({...leave, user: leave.user.id}));
        });

        return new Map(
            [...userShifts.entries()].sort((a, b) => {
                const userA = a[1];
                const userB = b[1];

                if (userA.hasOwnProperty('team') && userB.hasOwnProperty('team'))
                    if (userA.team.id !== userB.team.id)
                        return userA.team.id < userB.team.id ? -1 : 1;
                    else
                        return userA.role.id > userB.role.id ? -1 : 1;

                else
                    return (userA.last_name + ' ' + userA.first_name)
                        .localeCompare(userB.last_name + ' ' + userB.first_name);
            })
        );

    }, [mapShiftsToDates]);

    // TODO: Change this and API endpoint to only return shifts. While the users are handled by different hook...
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
                                                map_to_users = false,
                                                map_to_dates = false,
                                                loading = true
                                            } = {}) => {

        setLoading(loading);
        setStatus([]);

        const shifts_type = map_to_users ? 'users' : map_to_dates ? 'dates' : 'shifts';
        const cacheKey = `${shifts_type}-${id || 0}-${start_date}-${end_date}-${user_scope}-${user_scope_id}`;

        let shifts = new Map(), users = [];

        if (shiftsCache.current[cacheKey]) {
            shifts = shiftsCache.current[cacheKey];
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

            ({shifts, users} = res.data);

            // TODO: Mapping to be moved to useSchedules hook.
            if (map_to_users)
                shifts = mapShiftsToUsers(shifts, users);

            else if (map_to_dates)
                shifts = mapShiftsToDates(shifts);

            shiftsCache.current[cacheKey] = shifts;
            setShifts(shifts);
            loading && setLoading(false);
            return shifts;

        } catch (err) {
            console.error('fetchShifts error:', err);
            const message = 'Error occurred while fetching the Shift data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

    }, [mapShiftsToUsers, mapShiftsToDates]);

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