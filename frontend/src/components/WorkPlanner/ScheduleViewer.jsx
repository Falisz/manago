// FRONTEND/components/WorkPlanner/ScheduleViewer.jsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useSchedules from '../../hooks/useSchedules';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import ComboBox from '../ComboBox';
import useAppState from '../../contexts/AppStateContext';
import Button from '../Button';
import Loader from '../Loader';
import UserShiftTable from './UserShiftTable';
import {formatDate} from "../../utils/dates";
import '../../styles/Schedule.css';

const ScheduleViewer = () => {
    const { appState, user, setScheduleEditor } = useAppState();
    const { modules } = appState;
    const { scheduleId } = useParams();
    const { schedule, loading, setSchedule, fetchScheduleDraft } = useSchedules();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();
    const { search } = useLocation();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const setSearchParams = useSearchParams()[1];
    const navigate = useNavigate();
    const scopeOptions = [
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
    const start_date = formatDate(new Date(now));
    const end_date = formatDate(new Date(now + 6 * DAY_IN_MS));

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        const newParams = new URLSearchParams(search);
        const scheduleConfig = { ...schedule, [name]: value };

        if (name === 'user_scope') {
            if (value === 'you') {
                setSchedule({[name]: value, user_scope_id: user.id});
                scheduleConfig.user_scope_id = user.id;
            } else {
                setSchedule({[name]: value, user_scope_id: null});
                scheduleConfig.user_scope_id = null;
            }
        } else {
            setSchedule({ [name]: value });
        }


        // TODO: Rewrite this to be using iteration over urlKeys and scheduleConfig to avoid code duplication.
        const urlKeys = {
            view: 'view',
            start_date: 'from',
            end_date: 'to',
            month: 'month',
            user_scope: 'scope',
            user_scope_id: 'sid'
        };

        if (schedule.start_date)
            newParams.set('from', schedule.start_date);
        else
            newParams.delete('from');

        if (schedule.end_date)
            newParams.set('to', schedule.end_date);
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

        if (schedule.user_scope_id)
            newParams.set('sid', schedule.user_scope_id);
        else
            newParams.delete('sid');

        newParams.set(urlKeys[name], value);

        if (name === 'user_scope' && value === 'you')
            newParams.delete('sid');

        setSearchParams(newParams, { replace: true });
        
    }, [setSchedule, setSearchParams, user, search, schedule]);

    const editSchedule = useCallback(() => {
        setScheduleEditor({...schedule, type: schedule.id ? 'draft' : 'current'});
        navigate('/schedules/edit' + (schedule.id ? ('/' + schedule.id) : ''));
    }, [setScheduleEditor, navigate, schedule]);

    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();

        if (scheduleId) {
            fetchScheduleDraft({scheduleId}).then();
            return;
        }

        const scheduleConfig = {
            name: 'Current Schedule',
            view: 'users',
            start_date,
            end_date,
            user_scope: 'you',
            user_scope_id: user.id,
            fetch_shifts: true
        };

        const view = params.get('view');
        if (view)
            scheduleConfig.view = view;

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
        
        setSchedule(scheduleConfig);

    }, [scheduleId, user.id, params, start_date, end_date,
        fetchScheduleDraft, fetchUsers, fetchManagers, fetchTeams, setSchedule]);

    useEffect(() => {
        if (teams && schedule.user_scope === 'team') 
            setScopeIdOptions(teams['map']((team) =>
                ({id: team.id, name: team.name})
            ));

        else if (users && schedule.user_scope === 'user')
            setScopeIdOptions(users['map']((user) =>
                ({id: user.id, name: user.first_name + ' ' + user.last_name})
            ));
        
        else if (managers && schedule.user_scope === 'manager')
            setScopeIdOptions(managers['map']((manager) =>
                ({id: manager.id, name: manager.first_name + ' ' + manager.last_name})
            ));

    }, [schedule.user_scope, teams, users, managers]);

    const userScope = schedule.user_scope && schedule.user_scope[0].toUpperCase() + schedule.user_scope.slice(1);
    const scopeName = (schedule.user_scope !== 'you' && schedule.user_scope !== 'all' && scopeIdOptions &&
        scopeIdOptions.find(option => option.id === schedule.user_scope_id)?.['name']) || null;

    return <div className={'app-schedule seethrough'}>
        <div className={'app-schedule-header'}>
            <h1>{scheduleId ? 'Draft Preview: ' + schedule.name : 'Current Schedule'}</h1>
            <div
                className={'app-form'}
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: '10px'
                }}
            >
                <div className={'form-group'}>
                    <label>View</label>
                    <ComboBox
                        name={'view'}
                        searchable={false}
                        value={schedule.view || 'users'}
                        options={[
                            {id: 'users', name: 'Users'},
                            {id: 'jobs', name: 'Jobs'},
                            {id: 'monthly', name: 'Monthly'}
                        ]}
                        style={{minWidth: '150px'}}
                        onChange={handleChange}
                    />
                </div>
                { scheduleId ? <>
                    <div className={'form-group'}>
                        <label>User Scope</label>
                        <span style={{padding: '8px'}}><b>{userScope}{scopeName && ':'}</b> {scopeName}</span>
                    </div>
                    <div className={'form-group'}>
                        <label>Date Range</label>
                        <span style={{padding: '8px', whiteSpace: 'nowrap'}}>{schedule.start_date} - {schedule.end_date}</span>
                    </div>
                </> :
                    <>
                        <div className={'form-group'}>
                            <label>User Scope</label>
                            <div className={'form-group'} style={{flexDirection: 'row'}}>
                                <ComboBox
                                    placeholder={'Pick a group'}
                                    name={'user_scope'}
                                    searchable={false}
                                    value={schedule.user_scope || 'you'}
                                    options={scopeOptions}
                                    onChange={handleChange}
                                    style={{minWidth: '150px'}}
                                    disabled={!!scheduleId}
                                />
                                { schedule.user_scope && !['all', 'you'].includes(schedule.user_scope) && <ComboBox
                                    placeholder={`Pick a ${schedule.user_scope}`}
                                    name={'user_scope_id'}
                                    searchable={true}
                                    value={schedule.user_scope_id || null}
                                    options={scopeIdOptions}
                                    style={{minWidth: '150px'}}
                                    onChange={handleChange}
                                    disabled={!!scheduleId}
                                />}
                            </div>
                        </div>
                        { schedule.view !== 'monthly' && <div className={'form-group'}>
                            <label>Date range</label>
                            <div className={'form-group date-range'} style={{flexDirection: 'row'}}>
                                <input
                                    className={'form-input'}
                                    name={'start_date'}
                                    value={schedule.start_date || start_date}
                                    max={schedule.end_date}
                                    onChange={handleChange}
                                    type={'date'}
                                    style={{minWidth: '100px'}}
                                    disabled={!!scheduleId}
                                />
                                <span>-</span>
                                <input
                                    className={'form-input'}
                                    name={'end_date'}
                                    value={schedule.end_date || end_date}
                                    min={schedule.start_date}
                                    onChange={handleChange}
                                    type={'date'}
                                    style={{minWidth: '100px'}}
                                    disabled={!!scheduleId}
                                />
                            </div>
                        </div>}
                        { schedule.view === 'monthly' && <div className={'form-group'}>
                            <label>Month</label>
                            <div className={'form-group'} style={{flexDirection: 'row'}}>
                                <input
                                    className={'form-input'}
                                    placeholder={'month'}
                                    name={'month'}
                                    value={schedule.month}
                                    type={'month'}
                                    onChange={handleChange}
                                    disabled={!!scheduleId}
                                />
                            </div>
                        </div>}
                    </>
                }
            </div>
            { schedule.view === 'users' && 
                <Button
                    label='Edit Schedule'
                    icon='edit'
                    style={{marginLeft: 'auto'}}
                    onClick={editSchedule}
                />
            }
        </div>
        { loading ? <Loader/> : 
            schedule.view === 'users' ?
                <UserShiftTable
                    schedule={schedule}
                    editable={false}
                /> : 
            schedule.view === 'monthly' ?
                <div>MonthlyShiftTable - Monthly calendar will be here. Similarly with below, it allows to set up date and select branch/weekend.</div> : 
            schedule.view === 'jobs' &&
                <div>JobShiftsTable - Job Posts schedule will be here. This will be only available if job posts are enabled. It has only branch and project views for specific date-scopes.</div>
        }
    </div>
};

export default ScheduleViewer;