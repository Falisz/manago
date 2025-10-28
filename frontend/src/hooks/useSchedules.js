// FRONTEND/hooks/useSchedules.js
import { useCallback, useState } from 'react';
import useAppState from '../contexts/AppStateContext';
import axios from 'axios';
import useUsers from './useUsers';
import useShifts from './useShifts';
import useLeaves from './useLeaves';

const useSchedules = () => {
    const { user } = useAppState();
    
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const [ schedule, setSchedule ] = useState({
        type: 'users',
        start_date: new Date(now),
        end_date: new Date(now + 6 * DAY_IN_MS),
        month: null,
        user_scope: 'you',
        scope_id: user.id,
        name: '',
        description: '',
        users: new Map(),
        placeholder: null,
    });
    const [scheduleDrafts, setScheduleDrafts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState([]);
    
    const fetchScheduleDrafts = useCallback(async ({scheduleId, include_shifts, include_user_count, loading = true}) => {

        let scheduleDrafts;
        
        setLoading(loading);
        try {

            let url;

            if (scheduleId)
                url = `/schedules/${scheduleId}`;
            else
                url = '/schedules';

            if (include_shifts)
                url += '?include_shifts=true';

            const res = await axios.get(url , { withCredentials: true });

            scheduleDrafts = res.data;

            // TODO: To be implemented include_user_count
            // if (include_user_count) 
            //     iterate over each scheduleDraft and fetch user count based on unique users in .shifts field.


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

    const { fetchUsers } = useUsers();
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();

    // TODO: Check why it sometimes set a pure user object instead of the users map with shifts and leaves fields.

    const fetchUserShifts = useCallback( async () => {

        const user_scope = schedule.user_scope;
        const scope_id = schedule.scope_id;
        const start_date = schedule.start_date;
        const end_date = schedule.end_date;

        setLoading(true);
        
        let users = new Map();

        let placeholder;

        if (user_scope && !scope_id && !['all', 'you'].includes(user_scope)) {
            placeholder = `Please select a ${user_scope} first.`;
            setSchedule(prev => ({...prev, users, placeholder}));
            setLoading(false);
            return {users, placeholder};
        }

        if (user_scope === 'all')
            users = await fetchUsers({map: true});

        else if (user_scope === 'you')
            users = await fetchUsers({userId: user.id, map: true});

        else if (user_scope === 'user')
            users = await fetchUsers({userId: scope_id, map: true});

        else if (['manager', 'team', 'branch', 'project'].includes(user_scope))
            users = await fetchUsers({user_scope, scope_id, map: true});

        else {
            placeholder = 'Invalid User scope selected.';
            setSchedule((prev) => ({...prev, users, placeholder}));
            setLoading(false);
            return {users, placeholder};
        }

        if (!users.size) {
            placeholder = 'No Users found.';
            setSchedule((prev) => ({...prev, users, placeholder}));
            setLoading(false);
            return {users, placeholder};
        }

        placeholder = null;

        const userIds = Array.from(users.keys());

        const shifts = await fetchShifts({users: userIds, start_date, end_date});
        
        const leaves = await fetchLeaves({users: userIds, start_date, end_date});

        users.forEach((user, userId) => {
            user.shifts = shifts
                .filter(shift => shift.user.id === userId)
                .map(shift => ({...shift, user: shift.user.id}));
            user.leaves = leaves
                .filter(leave => leave.user.id === userId)
                .map(leave => ({...leave, user: leave.user.id}));
        });

        users = new Map(
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

        setSchedule(prev => ({...prev, users, placeholder}));
        setLoading(false);
        return {users, placeholder};

    }, [fetchLeaves, fetchShifts, fetchUsers, 
        schedule.end_date, schedule.scope_id, schedule.start_date, schedule.user_scope, user.id]);

    const saveScheduleDraft = useCallback( async ({scheduleData}) => {
        setStatus([]);
        // Function to save (create, update) schedule drafts - not to publish them.
    }, []);

    const publishScheduleDraft = useCallback( async ({scheduleId, scheduleData, mode}) => {
        // Function to publish schedule drafts - not to update them.
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
        publishScheduleDraft
    };
};
export default useSchedules;