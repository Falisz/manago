// FRONTEND/hooks/useSchedules.js
import {useCallback, useState, useRef} from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';
import {useUsers, useLeaves, useShifts, useScheduleDrafts} from './useResource';

const useSchedules = () => {
    const { showPopUp } = useApp();
    const { fetchUsers, fetchUser } = useUsers();
    const { fetchLeaves } = useLeaves();
    const { fetchShifts } = useShifts();
    const { fetchSchedule, deleteSchedule } = useScheduleDrafts();

    const [ schedule, setSchedule ] = useState(null);
    const [ loading, setLoading ] = useState(true);

    const shiftUpdates = useRef({
        new: [],
        updated: [],
        deleted: []
    });

    // Auxiliary functions to map shifts and edit them in the schedule.
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

            const updatedTargetUser = {
                ...targetUserObj,
                shifts: new Map(targetUserObj.shifts).set(targetDate, updatedTargetDateShifts)
            };

            const isNew = typeof shift.id === 'string' && shift.id.startsWith('new');

            if (action === 'delete') {
                if (isNew)
                    shiftUpdates.current.new.filter(s => s.id !== shift.id);
                else
                    shiftUpdates.current.deleted.push(shift);

            } else {
                const bin = isNew ? 'new' : 'updated';

                shiftUpdates.current[bin] = shiftUpdates.current[bin].filter(s => s.id !== shift.id);
                shiftUpdates.current[bin].push(shift);
            }
            users.set(targetUser, updatedTargetUser);
            return { ...prev, users };
        });
    }, [setSchedule]);

    // API callbacks
    const getSchedule = useCallback( async ({
                                                id = null,
                                                start_date = schedule?.start_date || null,
                                                end_date = schedule?.end_date || null,
                                                user_scope = schedule?.user_scope || null,
                                                user_scope_id = schedule?.user_scope_id || null,
                                                view = schedule?.view || 'users',
                                                loading = true
    } = {}) => {

        if (!id && !start_date && !end_date && !user_scope && !user_scope_id)
            return;

        setLoading(loading);

        if (id) {
            const schedule = await fetchSchedule({id});
            schedule.users = mapUsers(schedule.shifts, schedule.users);
            schedule.view = view;

            setSchedule(schedule);

        } else {
            let users = new Map(), shifts = [], leaves = [];

            if (user_scope !== 'all' && !user_scope_id) {
                const placeholder = `Select ${user_scope || 'User scope'}.`;
                setSchedule((prev) => ({...prev, users, shifts, leaves, placeholder}));
                setLoading(false);
                return null;
            }

            if (['you', 'user'].includes(user_scope))
                users = await fetchUser({id: user_scope_id});
            else
                users = await fetchUsers({
                    user_scope,
                    user_scope_id
                });

            if (!Array.isArray(users))
                users = [users];

            if (!['all', 'you'].includes(user_scope) && user_scope && user_scope_id) {
                shifts = await fetchShifts({
                    start_date,
                    end_date,
                    user_scope,
                    user_scope_id,
                    schedule_id: null
                }) || [];

                leaves = await fetchLeaves({
                    start_date,
                    end_date,
                    user_scope,
                    user_scope_id,
                }) || [];
            }

            if (view === 'users')
                users = mapUsers(shifts, users, leaves);
            else
                shifts = mapDates(shifts);

            setSchedule((prev) => ({...prev, users, shifts, leaves, placeholder: null}));
        }

        loading && setLoading(false);
        return true;

    }, [fetchUsers, fetchUser, fetchShifts, fetchLeaves, fetchSchedule, setSchedule, mapDates, mapUsers,
        schedule?.start_date, schedule?.end_date, schedule?.user_scope, schedule?.user_scope_id, schedule?.view]);

    const saveSchedule = useCallback( async ({publish = false, overwrite = false} = {}) => {

        const { id, name, description, start_date, end_date, user_scope, user_scope_id } = schedule;

        const scheduleData = {
            id, name, description, start_date, end_date, user_scope, user_scope_id, publish, overwrite,
            shifts: shiftUpdates.current
        };

        try {
            let res;

            if (id)
                res = await axios.put(`/schedules/${id}`, scheduleData, {withCredentials: true});
            else
                res = await axios.post('/schedules', scheduleData, {withCredentials: true});

            if (!res)
                return null;

            const { data } = res;

            if (!data)
                return null;

            const { schedule, message, warning } = data;

            if (warning)
                showPopUp({type: 'warning', content: warning});

            if (message)
                showPopUp({type: 'success', content: message});

            schedule.users = mapUsers(schedule.shifts, schedule.users);

            setSchedule((prev) => ({...prev, ...schedule}));
            ['new', 'updated', 'deleted'].forEach(bin => shiftUpdates.current[bin] = []);
            return schedule || null;

        } catch (err) {
            console.log('saveSchedule error:', err);
            const message = 'Error occurred while saving Schedule Draft. Please try again.';
            showPopUp({type: 'error', content: message});
        }
    }, [schedule, setSchedule, mapUsers, showPopUp]);

    const discardSchedule = useCallback( async (id) => id && deleteSchedule({id}), [deleteSchedule]);

    return {
        schedule,
        setSchedule,
        loading,
        setLoading,
        getSchedule,
        updateUserShift,
        saveSchedule,
        discardSchedule,
    };
};
export default useSchedules;