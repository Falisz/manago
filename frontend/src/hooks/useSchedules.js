// FRONTEND/hooks/useSchedules.js
import {useCallback, useState, useEffect, useMemo, useRef} from 'react';
import axios from 'axios';
import useLeaves from './useLeaves';
import {formatDate} from "../utils/dates";

// TODO: Make schedule fields separate as in users: [user{}], shifts: [shift{}], user_shifts: map(id=>user{..., shifts: map(date=>shifts[])});

const useSchedules = () => {
    const [ schedules, setSchedules ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ status, setStatus ] = useState([]);

    const schedule = useMemo(() => (schedules && schedules[0]) || {}, [schedules]);
    const setSchedule = useCallback((updater, set = false) => {
        setSchedules(prevSchedules => {
            const prevSchedule = (prevSchedules && prevSchedules[0]) || {};

            let newSchedule;

            if (typeof updater === 'function')
                newSchedule = updater(prevSchedule);
            else
                newSchedule = set ? updater : { ...prevSchedule, ...updater };

            if (!prevSchedules) {
                return [newSchedule];
            } else {
                const newSchedules = [...prevSchedules];
                newSchedules[0] = newSchedule;
                return newSchedules;
            }
        });
    },[]);
    const schedulesCache = useRef({});

    const { fetchLeaves } = useLeaves();

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

    }, []);

    const fetchShifts = useCallback( async ({
                                                id = null,
                                                user,
                                                user_scope = schedule.user_scope,
                                                user_scope_id = schedule.user_scope_id,
                                                date,
                                                start_date = schedule.start_date,
                                                end_date = schedule.end_date,
                                                schedule_id = schedule.id,
                                                job_post,
                                                location,
                                                map_to_users = false,
                                                map_to_dates = false,
                                                loading = true
    } = {}) => {

        setLoading(loading);

        const cacheKey = `users-${id || 0}-${start_date}-${end_date}-${user_scope}-${user_scope_id}`;

        let shifts = new Map(), users = [], leaves = [];
        let placeholder = null;

        if (schedulesCache.current[cacheKey]) {
            ({users, shifts, leaves} = schedulesCache.current[cacheKey]);
            setSchedule({users, shifts, leaves});
            setLoading(false);
            return {users, shifts, leaves};
        }

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
            placeholder = `Please select a ${user_scope} first.`;
            setSchedule({users, shifts, leaves, placeholder});
            loading && setLoading(false);
            return {users, shifts, leaves, placeholder};
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
                    params.date = formatDate(date);
                else {
                    if (start_date)
                        params.start_date = formatDate(start_date);
                    if (end_date)
                        params.end_date = formatDate(end_date);
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

            leaves = await fetchLeaves({user_scope, user_scope_id, start_date, end_date});

            if (map_to_users)
                shifts = mapShiftsToUsers(shifts, users, leaves);

            else if (map_to_dates)
                shifts = mapShiftsToDates(shifts);


            schedulesCache.current[cacheKey] = {users, shifts, leaves};
            setSchedule({users, shifts, leaves, placeholder});
            loading && setLoading(false);
            return {users, shifts, leaves, placeholder};

        } catch (err) {
            console.error('fetchShifts error:', err);

            const message = 'Error occurred while fetching the Shift data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

    }, [schedule.id, schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id,
        fetchLeaves, setSchedule, mapShiftsToUsers, mapShiftsToDates]);

    const fetchShift = useCallback( async (shiftId) =>
        await fetchShifts({shiftId}), [fetchShifts]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, loading = true, view = 'users'} = {}) => {

        let schedules;
        
        setLoading(loading);
        try {

            let url;

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            const res = await axios.get(url , { withCredentials: true });

            schedules = res.data;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        if (Array.isArray(schedules))
            schedules = schedules.map(schedule => ({...schedule, view}));
        else
            schedules = [{...schedules, view}];

        setSchedules(schedules);
        setLoading(false);
        return schedules;
        
    }, []);

    const fetchScheduleDraft = useCallback( async ({scheduleId}) =>
        await fetchScheduleDrafts({scheduleId}), [fetchScheduleDrafts]);

    const saveScheduleDraft = useCallback( async ({scheduleId, formData}) => {
        setStatus([]);
        // Function to save (create, update) schedule drafts - not to publish them.

        let res;

        if (scheduleId)
            res = await ( axios.put(`/schedules/${scheduleId}`, formData, { withCredentials: true }));
        else
            res = await ( axios.post('/schedules', formData, { withCredentials: true }));

        if (!res)
            return null;

        const { data } = res;

        return ( data && data.scheduleDraft ) || null;
    }, []);

    const publishScheduleDraft = useCallback( async ({scheduleId}) => {
        setStatus([]);
        // Function to publish schedule drafts - not to update them.
        // It will be only available from the Schedule editor - therefore, no params are needed.
        const res = await ( axios.put(`/schedules/${scheduleId}`, { publish: true }, { withCredentials: true }));
        console.log('publishScheduleDraft called with scheduleId:', scheduleId, res);

    }, []);

    const discardScheduleDraft = useCallback( async ({scheduleId}) => {
        setStatus([]);
        // Function to discard schedule drafts.
        // It will be available from both Schedule editor and Schedule drafts list, therefore, param is included.
        console.log('discard called for scheduleId:', scheduleId);
    }, []);

    useEffect( () => {
        if (schedule.view === 'users')
            fetchShifts({map_to_users: true}).then();
        
    }, [fetchShifts, schedule.view]);

    return {
        schedules,
        schedule,
        scheduleDrafts: schedules,
        scheduleDraft: schedule,
        loading,
        status,
        setSchedules,
        setSchedule,
        setScheduleDrafts: setSchedules,
        setScheduleDraft: setSchedules,
        setLoading,
        setStatus,
        fetchShifts,
        fetchShift,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        publishScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;