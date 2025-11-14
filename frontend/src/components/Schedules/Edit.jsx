// FRONTEND/components/Schedules/Edit.js
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import useApp from '../../contexts/AppContext';
import useJobPosts from '../../hooks/useJobPosts';
import useSchedules from '../../hooks/useSchedules';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import Button from '../Button';
import EditForm from '../EditForm';
import Loader from '../Loader';
import UserSchedule from './UserSchedule';
import '../../styles/Schedules.css';

export const ScheduleEditForm = ({ schedule, setSchedule, saveSchedule, isNew, isEmpty }) => {
    const { appState } = useApp();
    const navigate = useNavigate();
    const { closeTopModal } = useApp();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useApp();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();
    }, [fetchUsers, fetchManagers, fetchTeams]);

    const scopeOptions = useMemo(() => ({
        scopes: [
            ...(appState.modules.find((m) => m.title === 'Teams' && m.enabled) ?
                [{ id: 'team', name: 'Team' }] : []),
            ...(appState.modules.find((m) => m.title === 'Branches' && m.enabled) ?
                [{ id: 'branch', name: 'Branch' }] : []),
            ...(appState.modules.find((m) => m.title === 'Projects' && m.enabled) ?
                [{ id: 'project', name: 'Project' }] : []),
            ...[{ id: 'manager', name: 'Users by Manager' }, { id: 'user', name: 'User' }],
        ],
        teams: (teams?.length && teams?.map(team => ({ id: team.id, name: team.name })))
            || [{id: null, name: 'None'}],
        users: (users?.length && users?.map(user => ({ id: user.id, name: `${user.first_name} ${user.last_name}` })))
            || [{id: null, name: 'None'}],
        managers: (managers?.length && managers?.map(mgr => ({ id: mgr.id, name: `${mgr.first_name} ${mgr.last_name}` })))
            || [{id: null, name: 'None'}],
        projects: [{id: null, name: 'None'}],
        branches: [{id: null, name: 'None'}]
    }), [appState.modules, teams, users, managers]);

    const formStructure = useMemo(() => {
        const users = schedule.users?.values() || [];
        const userList = Array.from(users.map(u => u.first_name + ' ' + u.last_name));

        return {
            header: {
                title: schedule.id ? `Editing ${schedule?.name}` : `Creating a new Schedule Draft`,
            },
            fields: {
                name: {
                    section: 0,
                    type: 'string',
                    inputType: 'input',
                    label: 'Name',
                    required: true,
                },
                description: {
                    section: 0,
                    type: 'string',
                    inputType: 'textarea',
                    label: 'Description',
                },
                start_date: {
                    section: 1,
                    type: 'date',
                    inputType: 'date',
                    label: 'Start Date',
                    required: true,
                    max: schedule.end_date,
                },
                end_date: {
                    section: 1,
                    type: 'date',
                    inputType: 'date',
                    label: 'End Date',
                    required: true,
                    min: schedule.start_date,
                },
                user_scope: {
                    section: 2,
                    type: 'string',
                    inputType: 'dropdown',
                    label: 'User Scope',
                    options: scopeOptions.scopes,
                    required: true,
                    disabled: !isEmpty.current,
                    onChange: () => setSchedule(prev => ({...prev, user_scope_id: null})),
                },
                user_scope_id: {
                    section: 2,
                    type: (['you', 'all'].includes(schedule.user_scope) ? 'hidden' : 'number'),
                    inputType: 'dropdown',
                    label: ' ',
                    options: schedule.user_scope === 'team' ? scopeOptions.teams :
                    schedule.user_scope === 'manager' ? scopeOptions.managers :
                        schedule.user_scope === 'user' ? scopeOptions.users :
                            schedule.user_scope === 'project' ? scopeOptions.projects :
                                schedule.user_scope === 'branch' ? scopeOptions.branches :
                                    [{ id: null, name: 'None'}],
                    required: !['you', 'all'].includes(schedule.user_scope),
                    disabled: !isEmpty.current
                },
                users: {
                    section: 3,
                    type: 'content',
                    style: {flexDirection: 'column'},
                    label: `Users (${userList.length})`,
                    content: <span style={{paddingLeft: '10px'}}>{userList.join(', ')}</span>
                }
            },
            sections: {
                2: {
                    style: {alignItems: 'flex-end'}
                }
            },
            onSubmit: {
                onSave: () => {
                    for (const field of ['start_date', 'end_date', 'user_scope', 'user_scope_id'])
                        if (schedule[field] == null)
                            return false;

                    saveSchedule();

                    if (schedule.user_scope && schedule.user_scope_id)
                        isEmpty.current = false;

                    return true;
                },
                    refreshTriggers: [['scheduleDrafts', true], ...(schedule.id ? [['scheduleDraft', schedule.id]] : [])],
                    label: 'Start planning'
            },
            onCancel: {
                handler: () => {
                    closeTopModal();
                    if (isNew.current)
                        navigate(-1);
                },
            }
        };
    }, [schedule, setSchedule, scopeOptions, closeTopModal, saveSchedule, isNew, isEmpty, navigate]);
    
    return <EditForm structure={formStructure} source={schedule} setSource={setSchedule} />;
};

const ScheduleEdit = () => {
    const { appCache } = useApp();
    const { openModal, updateModalProps, closeTopModal } = useApp();
    const { scheduleId } = useParams();
    const {
        schedule,
        setSchedule,
        updateUserShift,
        loading,
        setLoading,
        fetchSchedule,
        fetchScheduleDraft,
        saveScheduleDraft,
    } = useSchedules();
    const { jobPosts, fetchJobPosts } = useJobPosts();
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = useMemo(() => new URLSearchParams(search), [search]);

    const isNew = useRef(!scheduleId);
    const isEmpty = useRef(true);
    const isMounted = useRef(false);
    const modalIdRef = useRef(null);

    const discardChanges = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const saveSchedule = useCallback(() => {
            saveScheduleDraft().then();
        }
    , [saveScheduleDraft]);

    const publishSchedule = useCallback((schedule) => {

        const viewPath = `/schedules/view?from=${schedule.start_date}&to=${schedule.end_date}` +
            `&scope=${schedule.user_scope}&sid=${schedule.user_scope_id}`;

        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: `Are you sure you want to publish the Schedule? Publishing posts all the shifts in the draft to 
            the official Schedule. This action cannot be undone.`,
            onConfirm: () => {
                saveScheduleDraft({ schedule, publish: true}).then();
                closeTopModal();
                navigate(viewPath);
            },
            confirmLabel: 'Publish without overwriting',
            onConfirm2: () => {
                saveScheduleDraft({ schedule, publish: true, overwrite: true}).then();
                closeTopModal();
                navigate(viewPath);
            },
            confirmLabel2: 'Publish overwriting current Schedule',
        });
    }, [saveScheduleDraft, schedule.start_date, schedule.end_date, schedule.user_scope, schedule.user_scope_id,
        closeTopModal, navigate]);

    const editDetails = useCallback(() => {
        modalIdRef.current = openModal({
            content: 'component',
            type: 'dialog',
            component: ScheduleEditForm,
            props: {schedule, setSchedule, saveSchedule, isNew, isEmpty}
        });
    }, [openModal, schedule, setSchedule, saveSchedule]);

    useEffect(() => {
        if (isMounted.current)
            return;

        fetchJobPosts().then();
        setLoading(true);

        if (scheduleId) {
            fetchScheduleDraft(scheduleId).then();
            setLoading(false);
            isEmpty.current = false;
            isMounted.current = true;
            return;

        } else {
            const scheduleConfig = {};
            let paramMissing = false;

            const current = params.get('current');
            if (current)
                scheduleConfig.mode = 'current';
            else
                scheduleConfig.mode = 'new';

            const from = params.get('from');
            if (from && !isNaN(Date.parse(from)))
                scheduleConfig.start_date = from;
            else
                paramMissing = true;

            const to = params.get('to');
            if (to && !isNaN(Date.parse(to)))
                scheduleConfig.end_date = to;
            else
                paramMissing = true;

            const scope = params.get('scope');
            if (scope)
                scheduleConfig.user_scope = scope;
            else
                paramMissing = true;

            const sid = params.get('sid');
            if (sid && !isNaN(parseInt(sid)))
                scheduleConfig.user_scope_id = sid;
            else
                paramMissing = true;

            setSchedule(scheduleConfig);

            if (paramMissing) {
                editDetails();
                setLoading(false);
            }
        }

        isMounted.current = true;

    }, [isMounted, appCache, params, scheduleId, setSchedule, setLoading,
        fetchScheduleDraft, editDetails, fetchJobPosts]);

    useEffect(() => {
        if (modalIdRef.current !== null)
            updateModalProps(modalIdRef.current, { schedule, saveSchedule });
    }, [schedule, saveSchedule, updateModalProps]);

    useEffect(() => {
        if (isNew.current && isEmpty.current)
            fetchSchedule().then();
    }, [fetchSchedule]);

    if (loading)
        return <Loader/>;

    return (
        <div className={'app-schedule seethrough'}>
            <div className={'app-schedule-header'}>
                <span style={{marginRight: 'auto', fontSize: '2rem'}}>Schedule Editor: {
                    schedule.mode ==='new' ? 'New Schedule Draft' :
                        schedule.mode === 'current' ? 'Current Draft' :
                            schedule.name || ''
                }</span>
                <Button icon={'close'} label={'Discard Changes'} onClick={discardChanges}/>
                {schedule && (
                    schedule.mode === 'current' ? <>
                        <Button icon={'save'} label={'Save to Drafts'} onClick={editDetails}/>
                        <Button icon={'publish'} label={'Re-Publish'} onClick={() => publishSchedule(schedule)}/>
                    </> : <>
                        <Button icon={'edit'} label={'Edit Details'} onClick={editDetails}/>
                        <Button icon={'save'} label={'Save'} onClick={() => saveSchedule(schedule)}/>
                        <Button icon={'publish'} label={'Publish'} onClick={() => publishSchedule(schedule)}/>
                    </>
                )}
            </div>
            <UserSchedule
                schedule={schedule}
                updateUserShift={updateUserShift}
                editable={true}
                jobPosts={jobPosts}
            />
        </div>
    );
}

export default ScheduleEdit;