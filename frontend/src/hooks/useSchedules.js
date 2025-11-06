// FRONTEND/hooks/useSchedules.js
import {useCallback, useState, useEffect, useMemo, useRef} from 'react';
import axios from 'axios';
import useUsers from './useUsers';
import useShifts from './useShifts';
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
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();

    // TODO:
    //  two bins - one for new and updated shifts and one for deleted shifts to be properly handled once schedule
    //  is to be saved and sent to backend, as the schedule is saved to backend, the bins are cleared
    const shiftUpdates = useRef({
        updated: [],
        deleted: []
    });

    const updateUserShift = useCallback(({shift, sourceShift, action = 'update'}) => {
        if ((action === 'move' || action === 'copy') && !sourceShift) {
            console.error(`updateUserShift Error: Action '${action}' requires sourceShift`);
            return;
        }

        const shiftId = sourceShift?.id || shift.id;
        const targetUser = shift.user;
        const targetDate = shift.date;
        const sourceUser = sourceShift && sourceShift.user;
        const sourceDate = sourceShift && sourceShift.date;

        setSchedule((prev) => {
            const users = new Map(prev.users);

            if (action === 'move' && sourceUser && sourceDate) {
                const sourceUserObj = users.get(sourceUser) || { id: sourceUser, shifts: new Map() };
                const sourceDateShifts = sourceUserObj.shifts.get(sourceDate) || [];
                const filteredSourceShifts = sourceDateShifts.filter(s => s.id !== shiftId);

                const updatedSourceUser = {
                    ...sourceUserObj,
                    shifts: new Map(sourceUserObj.shifts).set(sourceDate, filteredSourceShifts)
                };
                users.set(sourceUser, updatedSourceUser);
            }

            const targetUserObj = users.get(targetUser) || { id: targetUser, shifts: new Map() };
            const targetDateShifts = targetUserObj.shifts.get(targetDate) || [];

            let updatedTargetDateShifts = [...targetDateShifts];

            if (action === 'add' || action === 'copy' || action === 'move') {
                const newShift = {
                    ...shift,
                    id: (action === 'copy') ? `new${Date.now()}` : shiftId
                };
                updatedTargetDateShifts.push(newShift);
            } else if (action === 'update') {
                updatedTargetDateShifts = targetDateShifts.map(s => s.id === shiftId ? { ...s, ...shift } : s);
            } else if (action === 'delete') {
                updatedTargetDateShifts = targetDateShifts.filter(s => s.id !== shiftId);
            }

            if (action === 'delete') {
                shiftUpdates.current.deleted.push(shift);
            } else {
                shiftUpdates.current.updated.filter(s => s.id !== shiftId);
                shiftUpdates.current.updated.push(shift);
            }

            const updatedTargetUser = {
                ...targetUserObj,
                shifts: new Map(targetUserObj.shifts).set(targetDate, updatedTargetDateShifts)
            };
            users.set(targetUser, updatedTargetUser);

            return { ...prev, users };
        });
    }, [setSchedule]);

    const fetchScheduleDrafts = useCallback(async ({
                                                       id,
                                                       include_shifts = true,
                                                       include_users = false,
                                                       include_leaves = false,
                                                       loading = true,
                                                       view = 'users'
    } = {}) => {

        let schedules;
        
        setLoading(loading);
        try {
            let url;
            let params = {};

            if (id) {
                url = `/schedules/${id}`;
            } else {
                url = '/schedules';

                if (include_shifts)
                    params.include_shifts = true;

                if (include_users)
                    params.include_users = true;

                if (include_leaves)
                    params.include_leaves = true;

                if (Object.keys(params).length > 0)
                    url = '/schedules?' + new URLSearchParams(params).toString();
            }

            const res = await axios.get(url , { withCredentials: true });

            schedules = res.data;

            if (Array.isArray(schedules))
                schedules = schedules.map(schedule => ({...schedule, view}));
            else
                schedules = [{...schedules, view}];

            setSchedules(schedules);
            loading && setLoading(false);
            return schedules;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }
        
    }, []);

    const fetchScheduleDraft = useCallback( async (id) =>
        await fetchScheduleDrafts({id}), [fetchScheduleDrafts]);

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
        const userShifts = new Map(users.map(user => [user.id, user]));

        userShifts.forEach((user, userId) => {
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

    }, [mapDates]);

    useEffect( () => {
        if (schedule.id)
            return;

        setLoading(true);

        async function fetchData() {

            const start_date = schedule.start_date;
            const end_date = schedule.end_date;
            const user_scope = schedule.user_scope;
            const user_scope_id = schedule.user_scope_id;
            const view = schedule.view;

            let users = new Map(), shifts = [], leaves = [];

            if (user_scope !== 'all' && !user_scope_id) {
                const placeholder = `Select ${user_scope}.`;
                setSchedule(prev => ({...prev, users, shifts, leaves, placeholder}));
                setLoading(false);
                return;
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
            });

            leaves = await fetchLeaves({
                start_date,
                end_date,
                user_scope,
                user_scope_id,
            })

            if (view === 'users')
                users = mapUsers(shifts, users, leaves);
            else
                shifts = mapDates(shifts);

            setSchedule(prev => ({...prev, users, shifts, leaves, placeholder: null}));
            setLoading(false);
        }

        fetchData().then();
        
    }, [fetchUsers, fetchShifts, fetchLeaves, setSchedule, schedule.id, schedule.start_date, schedule.end_date,
        schedule.user_scope, schedule.user_scope_id, schedule.view]);

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
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        publishScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;