// FRONTEND/hooks/useSchedules.js
import { useCallback, useState, useEffect } from 'react';
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

    const [ schedule, setSchedule ] = useState({
        id: null,
        type: 'users',
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
    });

    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const { fetchUsers } = useUsers();
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();

    const fetchUserShifts = useCallback( async () => {

        const id = schedule.id;
        const start_date = schedule.start_date;
        const end_date = schedule.end_date;
        const user_scope = schedule.user_scope;
        const user_scope_id = schedule.user_scope_id;

        setLoading(true);
        
        let userShifts = new Map();

        let placeholder;

        if (user_scope && !user_scope_id && !['all', 'you'].includes(user_scope)) {
            placeholder = `Please select a ${user_scope} first.`;
            setSchedule(prev => ({...prev, shifts: userShifts, placeholder}));
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
            setSchedule((prev) => ({...prev, shifts: userShifts, placeholder}));
            setLoading(false);
            return {shifts: userShifts, placeholder};
        }

        if (!userShifts.size) {
            placeholder = 'No Users found.';
            setSchedule((prev) => ({...prev, shifts: userShifts, placeholder}));
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

        setSchedule(prev => ({...prev, shifts: userShifts, placeholder}));
        setLoading(false);

    }, [fetchLeaves, fetchShifts, fetchUsers, user.id, 
        schedule.id, schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, loading = true} = {}) => {

        let scheduleDrafts;
        
        setLoading(loading);
        try {

            let url;

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            const res = await axios.get(url , { withCredentials: true });

            scheduleDrafts = res.data;

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        setScheduleDrafts(scheduleDrafts);
        setLoading(false);
        return scheduleDrafts;
        
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
        console.log('publishScheduleDraft called with data:', schedule);
    }, [schedule]);

    const discardScheduleDraft = useCallback( async ({scheduleId}) => {
        setStatus([]);
        // Function to discard schedule drafts.
        // It will be available from both Schedule editor and Schedule drafts list, therefore, param is included.
        console.log('discard called for scheduleId:', scheduleId);
    }, []);

    useEffect( () => {
        if (!schedule.fetch_shifts) {
            console.log("useSchedule Effect: fetch_shifts is false. Doing nothing.");
            return;
        }

        if (schedule.type === 'users') {
            console.log("useSchedule Effect: Fetching user shifts.");
            fetchUserShifts().then();
        }
        
    }, [fetchUserShifts, schedule.fetch_shifts, schedule.type]);

    return {
        schedule,
        scheduleDrafts,
        scheduleDraft: scheduleDrafts,
        loading,
        status,
        setSchedule,
        setLoading,
        setStatus,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        saveScheduleDraft,
        publishScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;