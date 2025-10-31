// FRONTEND/components/WorkPlanner/ScheduleIndex.jsx
import React, {useCallback, useEffect, useMemo} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import useSchedules from '../../hooks/useSchedules';
import ComboBox from '../ComboBox';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import Loader from '../Loader';
import ScheduleSelector from './ScheduleSelector';
import UserShiftTable from './UserShiftTable';
import '../../styles/Schedule.css';

const Schedule = () => {
    const { schedule, loading, setSchedule, setLoading } = useSchedules();
    const { setScheduleEditor } = useAppState();
    const { search } = useLocation();
    const setSearchParams = useSearchParams()[1];
    const navigate = useNavigate();
    const params = useMemo(() => new URLSearchParams(search), [search]);

    useEffect(() => {
        console.log("Schedule component: Fetching URL params to set schedule and turning on fetch_shifts.");

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

        setSchedule(prev => ({...prev, ...scheduleConfig, fetch_shifts: true}));

    }, [setSchedule, params]);

    const handleScheduleChange = useCallback((e) => {
        const { name, value } = e.target;

        setSchedule(prev => ({...prev, [name]: value }));

        const newParams = new URLSearchParams(search);
        newParams.set(name, value);
        setSearchParams(newParams, { replace: true });
    }, [setSchedule, search, setSearchParams]);

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
                style={{minWidth: 'unset'}}
                onChange={handleScheduleChange}
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
                update_url={true}
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