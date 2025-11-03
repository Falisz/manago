// FRONTEND/hooks/useSchedules.js
import { useCallback, useState, useEffect, useMemo } from 'react';
import useAppState from '../contexts/AppStateContext';
import axios from 'axios';
import useUsers from './useUsers';
import useShifts from './useShifts';
import useLeaves from './useLeaves';
import {formatDate} from "../utils/dates";

const useSchedules = () => {
    const { user } = useAppState();
    
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const start_date = formatDate(new Date(now));
    const end_date = formatDate(new Date(now + 6 * DAY_IN_MS));

    const [ schedules, setSchedules ] = useState([{
        id: null,
        view: 'users',
        name: 'Current Schedule',
        description: '',
        start_date,
        end_date,
        month: null,
        user_scope: 'you',
        user_scope_id: user.id,
        shifts: new Map(),
        placeholder: null,
        fetch_shifts: false
    }]);
    const schedule = useMemo(() => schedules[0], [schedules]);

    const setSchedule = useCallback((data, set = false) => {
        setSchedules(prev => {
            const schedules = [...prev];
            schedules[0] = set ? data : {...prev[0], ...data};
            return schedules;
        });
    },[]);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const { fetchUsers } = useUsers();
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();

    const fetchUserShifts = useCallback( async ({
                                                    id = schedule.id,
                                                    start_date = schedule.start_date,
                                                    end_date = schedule.end_date,
                                                    user_scope = schedule.user_scope,
                                                    user_scope_id = schedule.user_scope_id
                                                } = {}) => {

        setLoading(true);
        
        let userShifts = new Map();

        let placeholder;

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
            placeholder = `Please select a ${user_scope} first.`;
            setSchedule({shifts: userShifts, placeholder});
            setLoading(false);
            return {shifts: userShifts, placeholder};
        }

        if (user_scope === 'all')
            userShifts = await fetchUsers({map: true});

        else if (user_scope === 'you')
            userShifts = await fetchUsers({userId: user.id, map: true});

        else if (user_scope === 'user')
            userShifts = await fetchUsers({userId: user_scope_id, map: true});

        else if (['manager', 'team', 'branch', 'project'].includes(user_scope))
            userShifts = await fetchUsers({user_scope, scope_id: user_scope_id, map: true});

        else {
            placeholder = 'Invalid User scope selected.';
            setSchedule({shifts: userShifts, placeholder});
            setLoading(false);
            return {shifts: userShifts, placeholder};
        }

        if (!userShifts.size) {
            placeholder = 'No Users found.';
            setSchedule({shifts: userShifts, placeholder});
            setLoading(false);
            return {shifts: userShifts, placeholder};
        }

        placeholder = null;

        const userIds = Array.from(userShifts.keys());

        const shifts = await fetchShifts({users: userIds, start_date, end_date, schedule: id, date_map: true});
        
        const leaves = await fetchLeaves({users: userIds, start_date, end_date});

        userShifts.forEach((user, userId) => {
            user.shifts = shifts
                .filter(shift => shift.user.id === userId)
                .map(shift => ({...shift, user: shift.user.id}));
            user.leaves = leaves
                .filter(leave => leave.user.id === userId)
                .map(leave => ({...leave, user: leave.user.id}));
        });

        userShifts = new Map(
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

        setSchedule({shifts: userShifts, placeholder});
        setLoading(false);
        return {users: userShifts, shifts, leaves, placeholder};

    }, [fetchLeaves, fetchShifts, fetchUsers, setSchedule, user.id, 
        schedule.id, schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, loading = true} = {}) => {

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

        if (!Array.isArray(schedules))
            schedules = [schedules];

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
        console.log('publishScheduleDraft called with scheduleId:', scheduleId);
    }, []);

    const discardScheduleDraft = useCallback( async ({scheduleId}) => {
        setStatus([]);
        // Function to discard schedule drafts.
        // It will be available from both Schedule editor and Schedule drafts list, therefore, param is included.
        console.log('discard called for scheduleId:', scheduleId);
    }, []);

    useEffect( () => {
        if (!schedule.fetch_shifts)
            return;

        if (schedule.view === 'users')
            fetchUserShifts().then();
        
    }, [fetchUserShifts, schedule.fetch_shifts, schedule.view]);

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
        fetchUserShifts,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        publishScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;