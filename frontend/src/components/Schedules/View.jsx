// FRONTEND/components/Schedules/View.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import useApp from '../../contexts/AppContext';
import useSchedules from '../../hooks/useSchedules';
import {useTeams, useUsers, useScheduleDrafts} from '../../hooks/useResource';
import Button from '../Button';
import ComboBox from '../ComboBox';
import InWorks from '../InWorks';
import JobPostSchedule from './JobPostSchedule';
import Loader from '../Loader';
import MonthlySchedule from './MonthlySchedule';
import UserSchedule from './UserSchedule';
import {formatDate} from '../../utils/dates';
import '../../styles/Schedules.css';

// TODO: Move header to the separate sub-component "ScheduleViewHeader" and "DraftViewHeader"
const ScheduleView = () => {
    const { appState, user } = useApp();
    const { modules } = appState;
    const { scheduleId: draftId } = useParams();
    const { schedule, loading, setLoading, setSchedule, fetchSchedule, mapUsers } = useSchedules();
    const { schedule: draft, setSchedule: setDraft, loading: draftLoading, fetchSchedule: fetchDraft } = useScheduleDrafts();
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
        if (draftId)
            navigate('/schedules/edit/' + draftId);

        else
            navigate('/schedules/edit?current=true' +
                `&from=${schedule.start_date}&to=${schedule.end_date}` +
                `&scope=${schedule.user_scope}&sid=${schedule.user_scope_id}`);

    }, [draftId, schedule, navigate]);

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

        if (!!draftId)
            return;

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

    }, [draftId, user.id, setLoading, searchParams, defaultStartDate, defaultEndDate,
        fetchUsers, fetchManagers, fetchTeams, setSchedule]);

    /**
     * Update scopeIdOptions based on user_scope value, only for non-draft schedule.
     */
    useEffect(() => {
        if (!!draftId)
            return;

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

    }, [draftId, schedule.user_scope, teams, users, managers]);

    /**
     * Fetch draft schedule if draftId is provided or fetch current schedule otherwise.
     */
    useEffect(() => {
        if (draftId)
            fetchDraft({id: draftId}).then(
                _res => setDraft(prev => ({...prev, users: mapUsers(prev?.shifts, prev?.users)}))
            );
        else
            fetchSchedule().then();
    }, [fetchSchedule, setDraft, fetchDraft, draftId]);

    //
    // Logic for rendering Draft Schedule View
    //
    if (draftId) {

        if (draftLoading)
            return <Loader/>;

        const userScope = (draft && draft.user_scope && draft.user_scope[0].toUpperCase() + draft.user_scope.slice(1))
            || null;

        const scopeName = () => {
            if (draft?.user_scope === 'team') {
                const scope = teams?.find(team => team.id === draft.user_scope_id);
                if (scope)
                    return scope['name'];
            }
            if (draft?.user_scope === 'user') {
                const scope = users?.find(user => user.id === draft.user_scope_id);
                if (scope)
                    return scope['first_name'] + ' ' + scope['last_name'];
            }
            if (draft?.user_scope === 'manager') {
                const scope = managers?.find(mgr => mgr.id === draft.user_scope_id);
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
                <div className={'app-schedule-header'}>
                    <h1>Draft Preview: {draft?.name}</h1>
                    <div
                        className={'app-form'}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: '10px'
                        }}
                    >
                        <div className={'form-group'}>
                            <label>User Scope</label>
                            <span style={{padding: '8px'}}><b>{userScope}{scopeName() && ':'}</b> {scopeName()}</span>
                        </div>
                        <div className={'form-group'}>
                            <label>Date Range</label>
                            <span style={{padding: '8px', whiteSpace: 'nowrap'}}>{draft?.start_date} - {draft?.end_date}</span>
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
                { draft ? <UserSchedule schedule={draft}/> : <Loader/> }
            </div>
        );
    }

    //
    // Logic for rendering Current Schedule View
    //

    if (['monthly', 'jobs'].includes(schedule.view))
        scopeOptions = scopeOptions.filter(option => ['team', 'branch', 'project', 'all'].includes(option.id));

    return <div className={'app-schedule seethrough'}>
        <Helmet>
            <title>Current Schedule | MANAGO</title>
        </Helmet>
        <div className={'app-schedule-header'}>
            <h1>Current Schedule</h1>
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
                            disabled={!!draftId}
                        />
                        { schedule.user_scope && !['all', 'you'].includes(schedule.user_scope) && <ComboBox
                            placeholder={`Pick a ${schedule.user_scope}`}
                            name={'user_scope_id'}
                            searchable={true}
                            value={schedule.user_scope_id || null}
                            options={scopeIdOptions}
                            onChange={handleChange}
                            disabled={!!draftId}
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
                            disabled={!!draftId}
                        />
                        <span>-</span>
                        <input
                            className={'form-input'}
                            name={'end_date'}
                            value={schedule.end_date || defaultEndDate}
                            min={schedule.start_date}
                            onChange={handleChange}
                            type={'date'}
                            disabled={!!draftId}
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
                            disabled={!!draftId}
                        />
                    </div>
                </div>}
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