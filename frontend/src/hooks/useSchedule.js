// FRONTEND/hooks/useSchedule.js
import { useCallback, useState } from 'react';
import axios from 'axios';

const useSchedule = () => {

    const [workingSchedules, setWorkingSchedules] = useState(null);
    const [workingSchedulesLoading, setWorkingSchedulesLoading] = useState(true);

    const fetchWorkingSchedules = useCallback(async (loading=true) => {
        try {
            setWorkingSchedulesLoading(loading);
            const res = await axios.get('/schedules', { withCredentials: true });
            setWorkingSchedules(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching Working Schedules:', err);
            return null;
        } finally {
            setWorkingSchedulesLoading(false);
        }
    }, []);


    return {
        workingSchedules,
        workingSchedulesLoading,
        fetchWorkingSchedules
    };
};
export default useSchedule;