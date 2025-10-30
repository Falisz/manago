// FRONTEND/components/WorkPlanner/ScheduleEditor.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import UserShiftTable from './UserShiftTable';
import '../../styles/Schedule.css';
import useSchedules from '../../hooks/useSchedules';
import Loader from '../Loader';

const ScheduleEditor = () => {
    const { appCache } = useAppState();
    const { schedule, setSchedule, loading, setLoading, fetchUserShifts } = useSchedules();
    const isMounted = useRef(false);
    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    useEffect(() => {
        setLoading(true);
        
        if (!isMounted.current) {
            isMounted.current = true;
            if(appCache.current.schedule_editor)
                setSchedule({...appCache.current.schedule_editor});
            setLoading(false);
            return;
        }

        const parseDate = (dateStr) => {
            if (!dateStr) 
                return null;
            try {
                return new Date(dateStr);
            } catch {
                return dateStr;
            }
        };

        if (!schedule.user_scope)
            setSchedule(prev => ({...prev, user_scope: params.get('scope') }));

        if (!schedule.user_scope_id)
            setSchedule(prev => ({...prev, user_scope_id: parseInt(params.get('sid')) }));

        if (!schedule.start_date)
            setSchedule(prev => ({...prev, start_date: parseDate(params.get('from')) }));

        if (!schedule.end_date)
            setSchedule(prev => ({...prev, end_date: parseDate(params.get('to')) }));

        if (schedule.user_scope && schedule.user_scope_id && schedule.start_date && schedule.end_date &&
            (!schedule.shifts || !schedule.shifts.size))
            fetchUserShifts({
                start_date: new Date(schedule.start_date),
                end_date: new Date(schedule.end_date),
                user_scope: schedule.user_scope,
                user_scope_id: schedule.user_scope_id
            }).then();
        setLoading(false);

    }, [isMounted, appCache, schedule.user_scope, schedule.user_scope_id, schedule.start_date, schedule.end_date, schedule.shifts,
         params, setSchedule, setLoading, fetchUserShifts]);

    if (loading)
        return <Loader/>;

    return (
        <div className={'app-schedule seethrough'}>
            <div className={'app-schedule-header'}>
            <span style={{marginRight: 'auto', fontSize: '2rem'}}>Schedule Editor: {
                schedule.type ==='new' ? 'New Schedule Draft' :
                    schedule.type === 'current' ? 'Current Draft' :
                        schedule.name || ''
            }</span>
            {schedule && schedule.type !== 'current' && <Button icon={'edit'} label={'Edit Details'}/>}

            {schedule && schedule.type !== 'current' && <Button icon={'publish'} label={'Publish'}/>}
            {schedule && schedule.type === 'current' && <Button icon={'publish'} label={'Re-Publish'}/>}
            {schedule && schedule.type !== 'current' && <Button icon={'save'} label={'Save'}/>}
            {schedule && schedule.type === 'current' && <Button icon={'save'} label={'Save to Drafts'}/>}
            </div>
            <UserShiftTable
                schedule={schedule}
                setSchedule={setSchedule}
                editable={true}
            />
        </div>
    );
}

export default ScheduleEditor;
