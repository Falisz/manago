// FRONTEND/components/WorkPlanner/ScheduleEditor.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import UserShiftTable from './UserShiftTable';
import '../../styles/Schedule.css';
import useSchedules from '../../hooks/useSchedules';
import Loader from '../Loader';

const ScheduleEditor = () => {
    const { appCache } = useAppState();
    const { scheduleId } = useParams();
    const { schedule, setSchedule, loading, setLoading, fetchScheduleDraft } = useSchedules();
    const { search } = useLocation();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        setLoading(true);
        let scheduleConfig = {};

        if (scheduleId) {
            fetchScheduleDraft({scheduleId}).then();
            return;
        } else if (appCache.current.schedule_editor) {
            scheduleConfig = appCache.current.schedule_editor;
        } else {
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
        }

        setSchedule(scheduleConfig);
        setLoading(false);

    }, [isMounted, appCache, params, scheduleId, setSchedule, setLoading, fetchScheduleDraft]);

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
