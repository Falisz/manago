// FRONTEND/hooks/useSchedules.js
import { useCallback, useState } from 'react';
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
        name: 'Current Schedule',
        description: '',
        type: 'users',
        start_date,
        end_date,
        month: null,
        user_scope: 'you',
        user_scope_id: user.id,
        shifts: new Map(),
        placeholder: null,
    });

    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);

    const { fetchUsers } = useUsers();
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();

    const fetchUserShifts = useCallback( async ({start_date, end_date, user_scope, user_scope_id, schedule=null}={}) => {

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

        const shifts = await fetchShifts({users: userIds, start_date, end_date, schedule, date_map: true});
        
        const leaves = await fetchLeaves({users: userIds, start_date, end_date, schedule});

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
        return {
            shifts: userShifts, 
            user_count: userShifts.size, 
            shift_count: shifts.length, 
            leave_count: leaves.length, 
            placeholder
        };

    }, [fetchLeaves, fetchShifts, fetchUsers, user.id]);

    const fetchScheduleDrafts = useCallback(async ({scheduleId, include_shifts, loading = true}) => {

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

            if (include_shifts) {
                if (Array.isArray(scheduleDrafts)) {
                    await Promise.all(scheduleDrafts.map( async (scheduleDraft, index) => {
                        const shiftsRes = fetchUserShifts({
                            user_scope: scheduleDraft.user_scope,
                            user_scope_id: scheduleDraft.user_scope_id,
                            schedule: scheduleDraft.id, 
                            loading: false
                        });
                        scheduleDrafts[index].shifts = shiftsRes.shifts;
                        scheduleDrafts[index].user_count = shiftsRes.user_count;
                        scheduleDrafts[index].shift_count = shiftsRes.shift_count;
                        scheduleDrafts[index].leave_count = shiftsRes.leave_count;
                    }));
                } else {
                    const shiftsRes = await fetchUserShifts({
                        user_scope: scheduleDrafts.user_scope,
                        user_scope_id: scheduleDrafts.user_scope_id,
                        schedule: scheduleDrafts.id, 
                        loading: false
                    });
                    scheduleDrafts.shifts = shiftsRes.shifts;
                    scheduleDrafts.user_count = shiftsRes.user_count;
                    scheduleDrafts.shift_count = shiftsRes.shift_count;
                    scheduleDrafts.leave_count = shiftsRes.leave_count;
                }
            }

        } catch (err) {
            console.error('fetchScheduleDrafts error:', err);

            const message = 'Error occurred while fetching the Schedule Draft data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        setScheduleDrafts(scheduleDrafts);
        setLoading(false);
        return scheduleDrafts;
        
    }, [fetchUserShifts]);

    const fetchScheduleDraft = useCallback( async ({scheduleId}) =>
        await fetchScheduleDrafts({scheduleId}), [fetchScheduleDrafts]);

    const saveScheduleDraft = useCallback( async () => {
        setStatus([]);
        // Function to save (create, update) schedule drafts - not to publish them.
        // It will be only available from the Schedule editor - therefore, no params are needed.
        console.log('saveScheduleDraft called with data:', schedule);
    }, [schedule]);

    const publishScheduleDraft = useCallback( async () => {
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

    return {
        schedule,
        loading,
        status,
        setLoading,
        setStatus,
        setSchedule,
        scheduleDrafts,
        scheduleDraft: scheduleDrafts,
        fetchScheduleDrafts,
        fetchScheduleDraft,
        fetchUserShifts,
        saveScheduleDraft,
        publishScheduleDraft,
        discardScheduleDraft
    };
};
export default useSchedules;