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

    const { fetchUsers } = useUsers();
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
                                                       scheduleId,
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

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            // TODO: Rewrite to using query function.
            if (include_shifts || include_leaves || include_users)
                url += '?';

            if (include_shifts)
                url += 'include_shifts=true';

            if (include_shifts && include_users)
                url += '&';

            if (include_users)
                url += 'include_users=true';

            if ((include_shifts && include_users) || (include_shifts && include_leaves))
                url += '&';

            if (include_leaves)
                url += 'include_leaves=true';

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
        setLoading(true);
        const id = schedule.id;
        const start_date = schedule.start_date;
        const end_date = schedule.end_date;
        const user_scope = schedule.user_scope;
        const user_scope_id = schedule.user_scope_id;
        const view = schedule.view;

        async function fetchData() {
            const users = await fetchUsers({
                user_scope,
                user_scope_id
            });

            const shifts = await fetchShifts({
                id,
                start_date,
                end_date,
                user_scope,
                user_scope_id,
                map_to_users: view === 'users',
                map_to_dates: view !== 'dates',
            });
            const leaves = await fetchLeaves({
                id,
                start_date,
                end_date,
                user_scope,
                user_scope_id,
            })

            return {users, shifts, leaves};
        }

        fetchData().then((res) => {
            const {users, shifts, leaves} = res;
            console.log(users);
            const key = view === 'users' ? 'users' : 'dates';
            setSchedule(prev => ({...prev, [key]: shifts, leaves}));
            setLoading(false);
        });
        
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