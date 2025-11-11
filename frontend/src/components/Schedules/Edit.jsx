// FRONTEND/components/Schedules/Edit.js
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import useAppState from '../../contexts/AppStateContext';
import useModals from '../../contexts/ModalContext';
import useSchedules from '../../hooks/useSchedules';
import useJobPosts from '../../hooks/useJobPosts';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import Button from '../Button';
import UserSchedule from './UserSchedule';
import Loader from '../Loader';
import EditForm from '../EditForm';
import '../../styles/Schedule.css';

export const ScheduleEditForm = ({ schedule, setSchedule, saveSchedule, isEmpty }) => {
    const { appState } = useAppState();
    const { closeTopModal } = useModals();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();

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

    const formStructure = useMemo(() => ({
        header: {
            title: schedule.id ? `Editing ${schedule?.name}` : `Creating a new Schedule Draft`,
        },
        inputs: {
            name: {
                section: 0,
                field: 'name',
                type: 'string',
                inputType: 'input',
                label: 'Name',
                required: true,
            },
            description: {
                section: 0,
                field: 'description',
                type: 'string',
                inputType: 'textarea',
                label: 'Description',
            },
            start_date: {
                section: 1,
                field: 'start_date',
                type: 'date',
                inputType: 'date',
                label: 'Start Date',
                required: true,
                conditional_max: () => schedule.end_date,
            },
            end_date: {
                section: 1,
                field: 'end_date',
                type: 'date',
                inputType: 'date',
                label: 'End Date',
                required: true,
                conditional_min: () => schedule.start_date,
            },
            user_scope: {
                section: 2,
                field: 'user_scope',
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
                field: 'user_scope_id',
                type: () => (['you', 'all'].includes(schedule.user_scope) ? 'hidden' : 'number'),
                inputType: 'dropdown',
                label: ' ',
                options: () => schedule.user_scope === 'team' ? scopeOptions.teams :
                    schedule.user_scope === 'manager' ? scopeOptions.managers :
                    schedule.user_scope === 'user' ? scopeOptions.users : [],
                required: () => !['you', 'all'].includes(schedule.user_scope),
                disabled: !isEmpty.current
            },
            users: {
                section: 3,
                field: 'users',
                type: 'content',
                style: {flexDirection: 'column'},
                content: (() => {
                    const users = schedule.users?.values() || [];
                    const userList = Array.from(users.map(u => u.first_name + ' ' + u.last_name));
                    return <>
                        <label className={'form-group-label'}>Users ({userList.length})</label>
                        <span style={{paddingLeft: '10px'}}> {userList.join(', ')}</span>
                    </>;
                })()
            }
        },
        sections: {
            2: {
                style: {alignItems: 'flex-end'}
            }
        },
        onSubmit: {
            onSave: () => {
                saveSchedule();
                return true;
            },
            refreshTriggers: [['scheduleDrafts', true], ...(schedule.id ? [['scheduleDraft', schedule.id]] : [])],
            label: 'Start planning'
        },
        onCancel: {
            action: () => {
                closeTopModal();
            }
        }
    }), [schedule, setSchedule, scopeOptions, closeTopModal, saveSchedule, isEmpty]);
    
    return <EditForm structure={formStructure} source={schedule} setSource={setSchedule} />;
};

const ScheduleEdit = () => {
    const { appCache, user } = useAppState();
    const { openModal, updateModalProps } = useModals();
    const { scheduleId } = useParams();
    // TODO: To be determined by the URL
    const isNew = useRef(!scheduleId);
    const isEmpty = useRef(true);
    const { schedule,
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
    const isMounted = useRef(false);
    const modalIdRef = useRef(null);

    const discardChanges = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const saveSchedule = useCallback(() => {
        if (isNew.current)
            schedule.author = user.id;

        saveScheduleDraft({ schedule }).then(() => {
            if (isNew.current && isEmpty.current)
                isEmpty.current = false;
        });

    }, [user, schedule, saveScheduleDraft]);

    const publishSchedule = useCallback((schedule) => {
        //TODO: Create a modal prompt to confirm publishing
        saveScheduleDraft({ schedule, publish: true}).then();

    }, [saveScheduleDraft]);

    // TODO: Implement forced state of modal - it cannot be closed until filled properly.

    const editDetails = useCallback(() => {
        modalIdRef.current = openModal({
            content: 'component',
            type: 'dialog',
            closable: isNew.current,
            component: ScheduleEditForm,
            props: {schedule, setSchedule, saveSchedule, isEmpty}
        });
    }, [openModal, schedule, setSchedule, saveSchedule, isEmpty]);


    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchJobPosts().then();

        let scheduleConfig = {};

        // TODO: No more schedule editor. If no params provided for /schedules/edit it will atomatically navigate to schedule/new to make editForm popup forced
        if (scheduleId) {
            setLoading(true);
            fetchScheduleDraft(scheduleId).then();
            isEmpty.current = false;
            return;

        } else if (appCache.current.schedule_editor) {
            scheduleConfig = appCache.current.schedule_editor;

            isEmpty.current = !(scheduleConfig.users && scheduleConfig.users.size);

            if (scheduleConfig.mode === 'new') {
                editDetails();
                isNew.current = true;
            } else {
                isNew.current = false;
            }

        } else {

            setLoading(true);
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

    }, [isMounted, appCache, params, scheduleId, setSchedule, setLoading,
        fetchScheduleDraft, editDetails, fetchJobPosts]);

    useEffect(() => {
        if (modalIdRef.current !== null) {
            updateModalProps(modalIdRef.current, { schedule });
        }
    }, [schedule, updateModalProps]);

    useEffect(() => {
        isNew.current && isEmpty.current && fetchSchedule().then();
    }, [fetchSchedule])

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