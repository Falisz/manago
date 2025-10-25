// FRONTEND/components/WorkPlanner/ScheduleIndex.jsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import ComboBox from '../ComboBox';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import {formatDate, generateDateList} from '../../utils/dates';
import ScheduleSelector from './ScheduleSelector';
import UserShiftTable from './UserShiftTable';
import '../../styles/Schedule.css';

const Schedule = () => {
    const { user } = useAppState();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const [ _, setSearchParams ] = useSearchParams();
    const isMounted = useRef(false);

    const from = params.get('from');
    const fromDate = from ? new Date(from) : new Date(Date.now() - 86400000);

    const to = params.get('to');
    const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 6 * 86400000);

    const [schedule, setSchedule] = useState({
        type: params.get('schedule') || 'users',
        loading: true,
        placeholder: null,
        fromDate,
        toDate,
        month: null,
        userScope: params.get('scope') || 'you',
        scopeId: params.get('sid') || user.id,
        users: []
    });

    const { setScheduleEditor } = useAppState();

    const navigate = useNavigate();

    const editCurrent = useCallback(() => {
        setScheduleEditor({
            type: 'current',
            fromDate: schedule.fromDate,
            toDate: schedule.toDate,
            userScope: schedule.userScope,
            scopeId: schedule.scopeId,
            users: schedule.users
        });
        navigate('/planner/editor');
    }, [setScheduleEditor, navigate, schedule]);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const newParams = new URLSearchParams(search);

        if (schedule.type)
            newParams.set('schedule', schedule.type);
        else
            newParams.delete('schedule');

        if (schedule.fromDate)
            newParams.set('from', formatDate(schedule.fromDate));
        else
            newParams.delete('from');

        if (schedule.toDate)
            newParams.set('to', formatDate(schedule.toDate));
        else
            newParams.delete('to');

        if (schedule.month)
            newParams.set('month', schedule.month);
        else
            newParams.delete('month');

        if (schedule.userScope)
            newParams.set('scope', schedule.userScope);
        else
            newParams.delete('scope');

        if (schedule.scopeId && schedule.userScope !== 'you')
            newParams.set('sid', schedule.scopeId);
        else
            newParams.delete('sid');

        setSearchParams(newParams, { replace: true });
    }, [schedule, search, setSearchParams])

    const dates = generateDateList(schedule.fromDate, schedule.toDate);

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
                onChange={(e) => {setSchedule(prev => ({...prev, type: e.target.value }));}}
                style={{minWidth: 'unset'}}
                selectedStyle={{background: 'none'}}
                selectedTextStyle={{fontFamily: 'Roboto Condensed, sans-serif', color: 'var(--text-color)', fontSize: '2rem', margin: 0, padding: 0}}
            />
            <ScheduleSelector
                schedule={schedule}
                setSchedule={setSchedule}
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
        {schedule.type === 'users' &&
            <UserShiftTable
                dates={dates}
                users={schedule.users}
                placeholder={schedule.placeholder}
                loading={schedule.loading}
                editable={false}
            />
        }
        {schedule.type === 'monthly' &&
            <div>Monthly calendar will be here. Similarly with below, it allows to set up date and select branch/weekend.</div>
        }
        {schedule.type === 'jobs' &&
            <div>Job Posts schedule will be here. This will be only available if job posts are enabled. It has only branch and project views for specific date-scopes.</div>
        }
    </div>
};

export default Schedule;