// FRONTEND/components/WorkPlanner/ScheduleIndex.jsx
import React, {useCallback, useEffect, useRef, useMemo} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import useSchedules from '../../hooks/useSchedules';
import ComboBox from '../ComboBox';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import Loader from '../Loader';
import {formatDate} from '../../utils/dates';
import ScheduleSelector from './ScheduleSelector';
import UserShiftTable from './UserShiftTable';
import '../../styles/Schedule.css';

// TODO: Fix stability of the schedule loading.
const Schedule = () => {
    const { schedule, loading, setSchedule, setLoading, fetchUserShifts } = useSchedules();
    const { setScheduleEditor } = useAppState();
    const { search } = useLocation();
    const setSearchParams = useSearchParams()[1];
    const navigate = useNavigate();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const isMounted = useRef(false);

    useEffect(() => {
        console.log("Effect with fetching shift runs");
        fetchUserShifts({
            start_date: schedule.start_date,
            end_date: schedule.end_date,
            user_scope: schedule.user_scope,
            user_scope_id: schedule.user_scope_id
        }).then();
    }, [fetchUserShifts, schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id]);

    useEffect(() => {
        if (!isMounted.current)
            return;

        const from = params.get('from');
        if (from && !isNaN(Date.parse(from)))
            setSchedule(prev => ({...prev, start_date: from}));

        const to = params.get('to');
        if (to && !isNaN(Date.parse(to)))
            setSchedule(prev => ({...prev, end_date: to}));

        const user_scope = params.get('scope');
        if (user_scope)
            setSchedule(prev => ({...prev, user_scope}));

        const user_scope_id = params.get('sid');
        if (user_scope_id)
            setSchedule(prev => ({...prev, user_scope_id}));

    }, [setSchedule, params]);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            console.log("Effect with params updating gets blocked.");
            return;
        }

        console.log("Effect with params updating runs.");

        const newParams = new URLSearchParams(search);
        if (schedule.type)
            newParams.set('schedule', schedule.type);
        else
            newParams.delete('schedule');

        if (schedule.start_date)
            newParams.set('from', formatDate(schedule.start_date));
        else
            newParams.delete('from');

        if (schedule.end_date)
            newParams.set('to', formatDate(schedule.end_date));
        else
            newParams.delete('to');

        if (schedule.month)
            newParams.set('month', schedule.month);
        else
            newParams.delete('month');

        if (schedule.user_scope)
            newParams.set('scope', schedule.user_scope);
        else
            newParams.delete('scope');

        if (schedule.user_scope_id && schedule.user_scope !== 'you')
            newParams.set('sid', schedule.user_scope_id);
        else
            newParams.delete('sid');

        setSearchParams(newParams, { replace: true });
    }, [schedule, search, setSearchParams]);

    const editCurrent = useCallback(() => {
        setScheduleEditor({...schedule, type: 'current'});
        navigate('/planner/editor');
    }, [setScheduleEditor, navigate, schedule]);

    return <div className={'app-schedule seethrough'}>
        <div className={'app-schedule-header'}>
            <ComboBox
                name={'type'}
                searchable={false}
                value={schedule.type}
                options={[
                    {id: 'users', name: 'User Schedule'},
                    {id: 'jobs', name: 'Jobs Schedule'},
                    {id: 'monthly', name: 'Monthly Schedule'}
                ]}
                onChange={(e) => setSchedule(prev => ({...prev, type: e.target.value}))}
                style={{minWidth: 'unset'}}
                selectedStyle={{background: 'none'}}
                selectedTextStyle={{fontFamily: 'Roboto Condensed, sans-serif', color: 'var(--text-color)', fontSize: '2rem', margin: 0, padding: 0}}
            />
            <ScheduleSelector
                schedule={schedule}
                setSchedule={setSchedule}
                setLoading={setLoading}
                include_all={schedule.type === 'users'}
                include_you={schedule.type === 'users'}
                include_teams={true}
                include_branches={true}
                include_projects={true}
                include_specific={schedule.type === 'users'}
                include_by_manager={schedule.type === 'users'}
                date_range={schedule.type !== 'monthly'}
                monthly={schedule.type === 'monthly'}
            />
            {schedule.type === 'users' && <Button
                label='Edit Schedule'
                icon='edit'
                style={{marginLeft: 'auto'}}
                onClick={editCurrent}
            />}
        </div>
        {loading ? <Loader/> : 
        schedule.type === 'users' ?
            <UserShiftTable
                schedule={schedule}
                editable={false}
            /> : 
        schedule.type === 'monthly' ?
            <div>MonthlyShiftTable - Monthly calendar will be here. Similarly with below, it allows to set up date and select branch/weekend.</div> : 
        schedule.type === 'jobs' &&
            <div>JobShiftsTable - Job Posts schedule will be here. This will be only available if job posts are enabled. It has only branch and project views for specific date-scopes.</div>
        }
    </div>
};

export default Schedule;