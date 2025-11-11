// FRONTEND/hooks/useSchedules.js
import {useCallback, useState, useMemo, useRef} from 'react';
import axios from 'axios';
import useUsers from './useUsers';
import useLeaves from './useLeaves';

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

    const { fetchUsers, fetchUser } = useUsers();
    const { fetchLeaves } = useLeaves();

    const shiftUpdates = useRef({
        new: [],
        updated: [],
        deleted: []
    });

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

        let shifts = new Map();

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
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

    const updateUserShift = useCallback(({shift, sourceShift, action = 'update'}) => {
        if ((action === 'move' || action === 'copy') && !sourceShift) {
            console.error(`updateUserShift Error: Action '${action}' requires sourceShift`);
            return;
        }

        if (action === 'add' || action === 'copy')
            shift.id = `new${Date.now()}`;

        const targetUser = shift.user;
        const targetDate = shift.date;
        const sourceUser = sourceShift && sourceShift.user;
        const sourceDate = sourceShift && sourceShift.date;

        setSchedule((prev) => {
            const users = new Map(prev.users);

            if (action === 'move' && sourceUser && sourceDate) {
                const sourceUserObj = users.get(sourceUser) || { id: sourceUser, shifts: new Map() };
                const sourceDateShifts = sourceUserObj.shifts.get(sourceDate) || [];
                const filteredSourceShifts = sourceDateShifts.filter(s => s.id !== sourceShift.id);

                const updatedSourceUser = {
                    ...sourceUserObj,
                    shifts: new Map(sourceUserObj.shifts).set(sourceDate, filteredSourceShifts)
                };
                users.set(sourceUser, updatedSourceUser);
            }

            const targetUserObj = users.get(targetUser) || { id: targetUser, shifts: new Map() };
            const targetDateShifts = targetUserObj.shifts.get(targetDate) || [];

            let updatedTargetDateShifts = [...targetDateShifts];

            if (['add', 'copy', 'move'].includes(action))
                updatedTargetDateShifts.push(shift);

            else if (action === 'update')
                updatedTargetDateShifts = targetDateShifts.map(s => s.id === shift.id ? { ...s, ...shift } : s);

            else if (action === 'delete')
                updatedTargetDateShifts = targetDateShifts.filter(s => s.id !== shift.id);


            if (action === 'delete') {
                if (toString(shift.id).startsWith('new'))
                    shiftUpdates.current.new.filter(s => s.id !== shift.id);
                else
                    shiftUpdates.current.deleted.push(shift);

            } else {
                const isNew = toString(shift.id).startsWith('new');
                const bin = isNew ? 'new' : 'updated';

                shiftUpdates.current[bin].filter(s => s.id !== shift.id);
                shiftUpdates.current[bin].push(shift);
            }

            const updatedTargetUser = {
                ...targetUserObj,
                shifts: new Map(targetUserObj.shifts).set(targetDate, updatedTargetDateShifts)
            };
            users.set(targetUser, updatedTargetUser);

            return { ...prev, users };
        });
    }, [setSchedule]);

    const mapDates = useCallback( (shifts) => {
        return shifts.reduce((map, shift) => {
            const date = shift.date;

            if (!map.has(date))
                map.set(date, []);

            map.get(date).push(shift);

            return map;
        }, new Map());
    }, []);

    const mapUsers = useCallback( (shifts, users, leaves) => {
        if (!users)
            return new Map();

        if (!(users instanceof Map))
            users = new Map(users.map(user => [user.id, user]));

        users.forEach((user, userId) => {
            user.shifts = shifts
                .filter(shift => shift.user.id === userId)
                .map(shift => ({...shift, user: shift.user.id}));

            user.shifts = mapDates(user.shifts);

            if (leaves)
                user.leaves = leaves
                    .filter(leave => leave.user.id === userId)
                    .map(leave => ({...leave, user: leave.user.id}));
        });

        return new Map(
            [...users.entries()].sort((a, b) => {
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

    }, [mapDates]);

    const fetchSchedule = useCallback( async ({
                                                  start_date = schedule.start_date,
                                                  end_date = schedule.end_date,
                                                  user_scope = schedule.user_scope,
                                                  user_scope_id = schedule.user_scope_id,
                                                  view = schedule.view || 'users',
                                                  loading = true} = {}) => {

        if (!start_date && !end_date && !user_scope && !user_scope_id)
            return;

        setLoading(loading);

        let users = new Map(), shifts = [], leaves = [];

        if (user_scope !== 'all' && !user_scope_id) {
            const placeholder = `Select ${user_scope || 'User scope'}.`;
            setSchedule(prev => ({...prev, users, shifts, leaves, placeholder}));
            setLoading(false);
            return null;
        }

        if (['you', 'user'].includes(user_scope))
            users = await fetchUser({userId: user_scope_id});
        else
            users = await fetchUsers({
                user_scope,
                user_scope_id
            });

        if (!Array.isArray(users))
            users = [users];

        shifts = await fetchShifts({
            start_date,
            end_date,
            user_scope,
            user_scope_id
        }) || [];

        leaves = await fetchLeaves({
            start_date,
            end_date,
            user_scope,
            user_scope_id,
        }) || [];

        if (view === 'users')
            users = mapUsers(shifts, users, leaves);
        else
            shifts = mapDates(shifts);

        setSchedule(prev => ({...prev, users, shifts, leaves, placeholder: null}));
        loading && setLoading(false);
        return true;

    }, [fetchUsers, fetchUser, fetchShifts, fetchLeaves, setSchedule, mapDates, mapUsers,
        schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id, schedule.view]);

    const fetchScheduleDrafts = useCallback(async ({ id, loading = true, view = 'users' } = {}) => {

        let schedules;
        setLoading(loading);

        try {
            let url;

            if (id)
                url = `/schedules/${id}`;
            else
                url = '/schedules';

            const res = await axios.get(url , { withCredentials: true });

            schedules = res.data;

            if (Array.isArray(schedules))
                schedules = schedules.map(schedule => ({
                    ...schedule,
                    users: mapUsers(schedule.shifts, schedule.users),
                    view
                }));

            else
                schedules = [{
                    ...schedules,
                    users: mapUsers(schedules.shifts, schedules.users),
                    view
                }];

            setSchedules(schedules);
            loading && setLoading(false);
            return schedules;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }
        
    }, [mapUsers]);

    const fetchScheduleDraft = useCallback( async (id) =>
        await fetchScheduleDrafts({id}), [fetchScheduleDrafts]);

    const saveScheduleDraft = useCallback( async ({schedule = null, publish = false} = {}) => {

        console.log('saveScheduleDraft:', schedule);
        if (!schedule)
            return;

        for (const field in ['mode','leaves','users','view','placeholder'])
            delete schedule[field];
        schedule.shifts = shiftUpdates.current;
        schedule.publish = publish;

        console.log('saveScheduleDraft2:', schedule);

        setStatus([]);
        // try {
        //     let res;
        //
        //     if (schedule.id)
        //         res = await axios.put(`/schedules/${schedule.id}`, schedule, {withCredentials: true});
        //     else
        //         res = await axios.post('/schedules', schedule, {withCredentials: true});
        //
        //     if (!res)
        //         return null;
        //
        //     const {data} = res;
        //
        //     return (data && data.scheduleDraft) || null;
        //
        // } catch (err) {
        //     console.log('saveScheduleDraft error:', err);
        // }
    }, []);

    const discardScheduleDraft = useCallback( async (scheduleId) => {
        setStatus([]);
        // Function to discard schedule drafts.
        // It will be available from both Schedule editor and Schedule drafts list, therefore, param is included.
        console.log('discard called for scheduleId:', scheduleId);
    }, []);

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
        updateUserShift,
        fetchShifts,
        fetchShift,
        fetchSchedule,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;