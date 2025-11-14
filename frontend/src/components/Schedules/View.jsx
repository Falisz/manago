// FRONTEND/components/Schedules/View.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useApp from '../../contexts/AppContext';
import useSchedules from '../../hooks/useSchedules';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import Button from '../Button';
import ComboBox from '../ComboBox';
import InWorks from '../InWorks';
import JobPostSchedule from './JobPostSchedule';
import Loader from '../Loader';
import MonthlySchedule from './MonthlySchedule';
import UserSchedule from './UserSchedule';
import {formatDate} from '../../utils/dates';
import '../../styles/Schedules.css';

const ScheduleView = () => {
    const { appState, user } = useApp();
    const { modules } = appState;
    const { scheduleId } = useParams();
    const { schedule, loading, setLoading, setSchedule, fetchScheduleDraft, fetchSchedule } = useSchedules();
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

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        setSchedule((prev) => {
            const newSchedule = { ...prev, [name]: value};

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

            return newSchedule;
        });
        
        
    }, [setSchedule, setSearchParams, user, searchParams]);

    const editSchedule = useCallback(() => {
        if (schedule.id)
            navigate('/schedules/edit/' + schedule.id);

        else
            navigate('/schedules/edit?current=true' +
                `&from=${schedule.start_date}&to=${schedule.end_date}` +
                `&scope=${schedule.user_scope}&sid=${schedule.user_scope_id}`);

    }, [schedule, navigate]);

    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();

        if (scheduleId) {
            fetchScheduleDraft(scheduleId).then();
            return;
        }

        setLoading(true);

        const currentSchedule = {
            name: 'Current Schedule',
            view: searchParams.get('view') || 'users',
            start_date: (() => {
                const from = searchParams.get('from');
                return from && !isNaN(Date.parse(from)) ? from : defaultStartDate; 
            })(),
            end_date: (() => {
                const to = searchParams.get('to');
                return to && !isNaN(Date.parse(to)) ? to : defaultEndDate; 
            })(),
            user_scope: searchParams.get('scope') || 'you',
            user_scope_id: (() => {
                const sid = searchParams.get('sid');
                return sid && !isNaN(parseInt(sid)) ? parseInt(sid, 10) : user.id; 
            })() || user.id,
            placeholder: null
        };
        
        setSchedule((prev) => ({...prev, ...currentSchedule}));

    }, [scheduleId, user.id, setLoading, searchParams, defaultStartDate, defaultEndDate, fetchScheduleDraft,
        fetchUsers, fetchManagers, fetchTeams, setSchedule]);

    useEffect(() => {
        if (teams && teams.length > 0 && schedule.user_scope === 'team') 
            setScopeIdOptions(teams.map((team) =>
                ({id: team.id, name: team.name})
            ));

        else if (users && Array.from(users).length > 0 && schedule.user_scope === 'user')
            setScopeIdOptions(Array.from(users).map((user) =>
                ({id: user.id, name: user.first_name + ' ' + user.last_name})
            ));
        
        else if (managers && Array.from(managers).length > 0 && schedule.user_scope === 'manager')
            setScopeIdOptions(Array.from(managers).map((manager) =>
                ({id: manager.id, name: manager.first_name + ' ' + manager.last_name})
            ));
        
        else
            setScopeIdOptions([{ id: null, name: 'None'}]);

    }, [schedule.user_scope, teams, users, managers]);

    useEffect(() => {
        if (!scheduleId)
            fetchSchedule().then();
    }, [fetchSchedule, scheduleId]);

    const userScope = schedule.user_scope && schedule.user_scope[0].toUpperCase() + schedule.user_scope.slice(1);
    const scopeName = (schedule.user_scope !== 'you' && schedule.user_scope !== 'all' && scopeIdOptions &&
        scopeIdOptions.find(option => option.id === schedule.user_scope_id)?.['name']) || null;

    if (['monthly', 'jobs'].includes(schedule.view))
        scopeOptions = scopeOptions.filter(option => ['team', 'branch', 'project', 'all'].includes(option.id));

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
                                    options={scopeOptions || []}
                                    onChange={handleChange}
                                    disabled={!!scheduleId}
                                />
                                { schedule.user_scope && !['all', 'you'].includes(schedule.user_scope) && <ComboBox
                                    placeholder={`Pick a ${schedule.user_scope}`}
                                    name={'user_scope_id'}
                                    searchable={true}
                                    value={schedule.user_scope_id || null}
                                    options={scopeIdOptions}
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
                                    value={schedule.start_date || defaultStartDate}
                                    max={schedule.end_date}
                                    onChange={handleChange}
                                    type={'date'}
                                    disabled={!!scheduleId}
                                />
                                <span>-</span>
                                <input
                                    className={'form-input'}
                                    name={'end_date'}
                                    value={schedule.end_date || defaultEndDate}
                                    min={schedule.start_date}
                                    onChange={handleChange}
                                    type={'date'}
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
                <UserSchedule schedule={schedule}/> : 
            schedule.view === 'monthly' ?
                <MonthlySchedule schedule={schedule}/> : 
            schedule.view === 'jobs' ?
                <JobPostSchedule schedule={schedule}/> :
            <InWorks icon={'error'} title={'Cannot view Schedule'} description={'Invalid view type provided'} />
        }
    </div>
};

export default ScheduleView;