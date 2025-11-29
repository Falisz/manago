// FRONTEND/components/Schedules/View.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import useApp from '../../contexts/AppContext';
import useSchedules from '../../hooks/useSchedules';
import {useTeams, useUsers} from '../../hooks/useResource';
import Button from '../Button';
import ComboBox from '../ComboBox';
import InWorks from '../InWorks';
import JobPostSchedule from './JobPostSchedule';
import Loader from '../Loader';
import MonthlySchedule from './MonthlySchedule';
import UserSchedule from './UserSchedule';
import {formatDate} from '../../utils/dates';
import '../../styles/Schedules.css';

const CurrentViewHeader = ({schedule, editSchedule, handleChange, scopeOptions, scopeIdOptions}) => {

    const disableButton = !(schedule?.view === 'users' && schedule?.start_date && schedule?.end_date &&
        schedule?.user_scope && (schedule?.user_scope === 'all' || schedule?.user_scope_id));

    if (!schedule)
        return <Loader/>;

    return (
        <div className={'app-schedule-header'}>
            <h1>Current Schedule</h1>
            <div
                className={'form-content'}
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: '10px',
                    flexWrap: 'nowrap'
                }}
            >
                <div className={'form-group'} style={{flex: '0'}}>
                    <label>View</label>
                    <ComboBox
                        name={'view'}
                        style={{width: '5vw'}}
                        searchable={false}
                        value={schedule?.view || 'users'}
                        options={[
                            {id: 'users', name: 'Users'},
                            {id: 'jobs', name: 'Jobs'},
                            {id: 'monthly', name: 'Monthly'}
                        ]}
                        onChange={handleChange}
                    />
                </div>
                <div className={'form-group'} style={{flex: '0'}}>
                    <label>User Scope</label>
                    <div className={'form-group'} style={{flexDirection: 'row'}}>
                        <ComboBox
                            placeholder={'Pick a group'}
                            name={'user_scope'}
                            style={{width: '8vw'}}
                            searchable={false}
                            value={schedule?.user_scope || 'you'}
                            options={scopeOptions || []}
                            onChange={handleChange}
                        />
                        { schedule?.user_scope && !['all', 'you'].includes(schedule?.user_scope) && <ComboBox
                            placeholder={`Pick a ${schedule?.user_scope}`}
                            name={'user_scope_id'}
                            style={{width: '8vw'}}
                            searchable={true}
                            value={schedule?.user_scope_id || null}
                            options={scopeIdOptions}
                            onChange={handleChange}
                        />}
                    </div>
                </div>
                { schedule?.view !== 'monthly' && <div className={'form-group'} style={{flex: '0'}}>
                    <label>Date range</label>
                    <div className={'form-group date-range'} style={{flexDirection: 'row', alignItems: 'center'}}>
                        <input
                            className={'form-input'}
                            name={'start_date'}
                            style={{width: '8vw', minWidth: 'unset'}}
                            value={schedule?.start_date}
                            max={schedule?.end_date}
                            onChange={handleChange}
                            type={'date'}
                        />
                        <span>-</span>
                        <input
                            className={'form-input'}
                            name={'end_date'}
                            style={{width: '8vw', minWidth: 'unset'}}
                            value={schedule?.end_date}
                            min={schedule?.start_date}
                            onChange={handleChange}
                            type={'date'}
                        />
                    </div>
                </div>}
                { schedule?.view === 'monthly' && <div className={'form-group'}>
                    <label>Month</label>
                    <div className={'form-group'} style={{flexDirection: 'row'}}>
                        <input
                            className={'form-input'}
                            placeholder={'month'}
                            name={'month'}
                            value={schedule?.month}
                            type={'month'}
                            onChange={handleChange}
                        />
                    </div>
                </div>}
            </div>
            { schedule?.view === 'users' &&
                <Button
                    label='Edit Schedule'
                    icon='edit'
                    style={{marginLeft: 'auto'}}
                    onClick={editSchedule}
                    disabled={disableButton}
                />
            }
        </div>
    );
};

// TODO: Implement publish button.
const DraftViewHeader = ({schedule, editSchedule, userScope, scopeName}) => {
    return (
        <div className={'app-schedule-header'}>
            <h1>Draft Preview: {schedule?.name}</h1>
            <div
                className={'form-content'}
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: '10px'
                }}
            >
                <div className={'form-group'}>
                    <label>User Scope</label>
                    <span style={{padding: '8px'}}><b>{userScope}{scopeName && ':'}</b> {scopeName}</span>
                </div>
                <div className={'form-group'}>
                    <label>Date Range</label>
                    <span style={{padding: '8px', whiteSpace: 'nowrap'}}>
                        {schedule?.start_date} - {schedule?.end_date}
                    </span>
                </div>
            </div>
            <Button
                label='Edit Schedule'
                icon='edit'
                style={{marginLeft: 'auto'}}
                onClick={editSchedule}
            />
            <Button
                label='Publish Schedule'
                icon='publish'
                onClick={null}
            />
        </div>
    );
};


const ScheduleView = () => {
    const { appState, user } = useApp();
    const { modules } = appState;
    const { scheduleId } = useParams();
    const { schedule, loading, setLoading, getSchedule } = useSchedules();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    let scopeOptions = [
        { id: 'all', name: 'All Users' }, 
        { id: 'you', name: 'Yours' },
        ...(modules.find((m) => m.title === 'Teams' && m.enabled) ? [{ id: 'team', name: 'Team' }] : []),
        ...(modules.find((m) => m.title === 'Branches' && m.enabled) ? [{ id: 'branch', name: 'Branch' }] : []),
        ...(modules.find((m) => m.title === 'Projects' && m.enabled) ? [{ id: 'project', name: 'Project' }] : []),
        { id: 'manager', name: 'Users by Manager' }, 
        { id: 'user', name: 'User' }
    ];
    const [ scopeIdOptions, setScopeIdOptions ] = useState([{id: null, name: 'None'}]);
    const isMounted = useRef(false);
    
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const defaultStartDate = formatDate(new Date(now));
    const defaultEndDate = formatDate(new Date(now + 6 * DAY_IN_MS));

    const handleChange = useCallback(async (e) => {
        const { name, value } = e.target;

        const newSchedule = { ...schedule, [name]: value};

        if (name === 'user_scope') {
            if (value === 'you')
                newSchedule.user_scope_id = user.id;
            else
                newSchedule.user_scope_id = null;
        }

        const newParams = new URLSearchParams(searchParams);

        const urlKeys = [
            { field: 'view', url: 'view' },
            { field: 'start_date', url: 'from'},
            { field: 'end_date', url: 'to'},
            { field: 'month', url: 'month'},
            { field: 'user_scope', url: 'scope'},
            { field: 'user_scope_id', url: 'sid'}
        ];

        urlKeys.forEach(key => {
            const v = newSchedule[key.field];
            if (v != null && v!== '')
                newParams.set(key.url, String(v))
            else
                newParams.delete(key.url);
        });

        setSearchParams(newParams, { replace: true });

        const { view, start_date, end_date, user_scope, user_scope_id } = newSchedule;

        await getSchedule({name: 'Current Schedule', view, start_date, end_date, user_scope, user_scope_id});

    }, [setSearchParams, getSchedule, schedule, user, searchParams]);

    const editSchedule = useCallback(() => {
        if (scheduleId)
            navigate('/schedules/edit/' + scheduleId);

        else
            navigate('/schedules/edit?current=true' +
                `&from=${schedule.start_date}&to=${schedule.end_date}` +
                `&scope=${schedule.user_scope}&sid=${schedule.user_scope_id}`);

    }, [scheduleId, schedule, navigate]);

    /**
     * Component initializer logic. If draftId is provided, skipping the rest of logic.
     */
    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();

        if (scheduleId) {
            getSchedule({id: scheduleId}).then();
            return;
        }

        setLoading(true);

        const view = searchParams.get('view') || 'users';
        const from = searchParams.get('from');
        const start_date = from && !isNaN(Date.parse(from)) ? from : defaultStartDate;
        const to = searchParams.get('to');
        const end_date = to && !isNaN(Date.parse(to)) ? to : defaultEndDate;
        const user_scope = searchParams.get('scope') || 'you';
        const sid = searchParams.get('sid');
        const user_scope_id = sid && !isNaN(parseInt(sid)) ? parseInt(sid, 10) : user.id;

        getSchedule({
            name: 'Current Schedule',
            view,
            start_date,
            end_date,
            user_scope,
            user_scope_id
        }).then();

    }, [scheduleId, user.id, setLoading, searchParams, defaultStartDate, defaultEndDate,
        fetchUsers, fetchManagers, fetchTeams, getSchedule]);

    /**
     * Update scopeIdOptions based on user_scope value, only for non-draft schedule.
     */
    useEffect(() => {
        if (!!scheduleId || !schedule?.user_scope)
            return;

        if (teams && teams.length > 0 && schedule?.user_scope === 'team')
            setScopeIdOptions(teams.map((team) =>
                ({id: team.id, name: team.name})
            ));

        else if (users && Array.from(users).length > 0 && schedule?.user_scope === 'user')
            setScopeIdOptions(Array.from(users).map((user) =>
                ({id: user.id, name: user.first_name + ' ' + user.last_name})
            ));
        
        else if (managers && Array.from(managers).length > 0 && schedule?.user_scope === 'manager')
            setScopeIdOptions(Array.from(managers).map((manager) =>
                ({id: manager.id, name: manager.first_name + ' ' + manager.last_name})
            ));
        
        else
            setScopeIdOptions([{ id: null, name: 'None'}]);

    }, [scheduleId, schedule?.user_scope, teams, users, managers]);

    //
    // Logic for rendering Draft Schedule View
    //
    if (scheduleId) {

        const userScope = ( schedule && schedule.user_scope &&
                schedule.user_scope[0].toUpperCase() + schedule.user_scope.slice(1) ) || null;

        const scopeName = () => {
            if (schedule?.user_scope === 'team') {
                const scope = teams?.find(team => team.id === schedule.user_scope_id);
                if (scope)
                    return scope['name'];
            }
            if (schedule?.user_scope === 'user') {
                const scope = users?.find(user => user.id === schedule.user_scope_id);
                if (scope)
                    return scope['first_name'] + ' ' + scope['last_name'];
            }
            if (schedule?.user_scope === 'manager') {
                const scope = managers?.find(mgr => mgr.id === schedule.user_scope_id);
                if (scope)
                    return scope['first_name'] + ' ' + scope['last_name'];
            }
            return null;
        }

        return (
            <div className={'app-schedule seethrough'}>
                <Helmet>
                    <title>Schedule Preview | MANAGO</title>
                </Helmet>
                <DraftViewHeader
                    schedule={schedule}
                    editSchedule={editSchedule}
                    userScope={userScope}
                    scopeName={scopeName()}
                />
                { schedule ? <UserSchedule schedule={schedule}/> : <Loader/> }
            </div>
        );
    }

    //
    // Logic for rendering Current Schedule View
    //

    if (['monthly', 'jobs'].includes(schedule?.view))
        scopeOptions = scopeOptions.filter(option => ['team', 'branch', 'project', 'all'].includes(option.id));

    return <div className={'app-schedule seethrough'}>
        <Helmet>
            <title>Current Schedule | MANAGO</title>
        </Helmet>
        <CurrentViewHeader
            schedule={schedule}
            handleChange={handleChange}
            scopeOptions={scopeOptions}
            scopeIdOptions={scopeIdOptions}
            editSchedule={editSchedule}
        />
        { loading ? <Loader/> : 
            schedule?.view === 'users' ?
                <UserSchedule schedule={schedule}/> :
            schedule?.view === 'monthly' ?
                <MonthlySchedule schedule={schedule}/> : 
            schedule?.view === 'jobs' ?
                <JobPostSchedule schedule={schedule}/> :
            <InWorks icon={'error'} title={'Cannot view Schedule'} description={'Invalid view type provided'} />
        }
    </div>
};

export default ScheduleView;