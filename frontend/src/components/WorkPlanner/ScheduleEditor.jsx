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
    const { schedule, setSchedule, loading, setLoading } = useSchedules();
    const isMounted = useRef(false);
    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    useEffect(() => {
        if (isMounted.current)
            return;

        setLoading(true);
        
        if(appCache.current.schedule_editor) {
            setSchedule({...appCache.current.schedule_editor, stop_fetch: true}); 
            setLoading(false); 
            isMounted.current = true;
            return;
        }

        const scheduleConfig = {};

        const from = params.get('from');
        if (from && !isNaN(Date.parse(from)))
            scheduleConfig.start_date = from;

        const to = params.get('to');
        if (to && !isNaN(Date.parse(to)))
            scheduleConfig.end_date = to;

        const scope = params.get('scope');
        if (scope)
            scheduleConfig.user_scope = scope;

        const sid = params.get('sid');
        if (sid && !isNaN(parseInt(sid)))
            scheduleConfig.user_scope_id = sid;

        setSchedule(prev => ({...prev, ...scheduleConfig}));
        setLoading(false);
        isMounted.current = true;

    }, [isMounted, appCache, schedule.user_scope, schedule.user_scope_id, schedule.start_date, schedule.end_date, schedule.shifts,
         params, setSchedule, setLoading]);

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
