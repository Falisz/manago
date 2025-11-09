// FRONTEND/components/Schedules/Edit.js
import React, {useEffect, useMemo, useRef, useCallback} from 'react';
import { useLocation, useNavigate, useParams} from 'react-router-dom';
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
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();
    const { fetchUsers: fetchSelectedUsers } = useUsers();

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
        teams: teams && teams.map(team => 
            ({ id: team.id, name: team.name })),
        users: users && users.map(user => 
            ({ id: user.id, name: `${user.first_name} ${user.last_name}` })),
        managers: managers && managers.map(manager => 
            ({ id: manager.id, name: `${manager.first_name} ${manager.last_name}` })),
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
                conditional_max: (formData) => formData.end_date,
            },
            end_date: {
                section: 1,
                field: 'end_date',
                type: 'date',
                inputType: 'date',
                label: 'End Date',
                required: true,
                conditional_min: (formData) => formData.start_date,
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
            },
            user_scope_id: {
                section: 2,
                field: 'user_scope_id',
                conditional_type: (formData) => ['you', 'all'].includes(formData.user_scope) ? 'hidden' : 'number',
                inputType: 'dropdown',
                label: ' ',
                options: [],
                conditional_options: (formData) => formData.user_scope === 'team' ? scopeOptions.teams :
                            formData.user_scope === 'manager' ? scopeOptions.managers :
                            formData.user_scope === 'user' ? scopeOptions.users : [],
                conditional_required: (formData) => !['you', 'all'].includes(formData.user_scope),
                disabled: !isEmpty.current
            },
            users: {
                section: 3,
                field: 'users',
                type: 'content',
                style: {flexDirection: 'column'},
                async_content: async (formData) => {
                    if (
                        !formData.start_date ||
                        !formData.end_date ||
                        !formData.user_scope ||
                        (!['you', 'all'].includes(formData.user_scope) && !formData.user_scope_id)
                    )
                        return null;

                    const users = (schedule.user_scope && await fetchSelectedUsers({
                        user_scope: formData.user_scope,
                        user_scope_id: formData.user_scope_id
                    })) || [];
                    
                    const userList = Array.from(users.map(u => u.first_name + ' ' + u.last_name));

                    return <>
                        <label className={'form-group-label'}>Users ({userList.length})</label>
                        <span style={{paddingLeft: '10px'}}> {userList.join(', ')}</span>
                    </>;
                },
                async_content_deps: ['start_date', 'end_date', 'user_scope', 'user_scope_id'],
                async_content_should_load: (fd) =>
                    fd.start_date && fd.end_date && fd.user_scope &&
                    (!['you', 'all'].includes(fd.user_scope) ? fd.user_scope_id : true)
            }
        },
        sections: {
            2: {
                style: {alignItems: 'flex-end'}
            }
        },
        onSubmit: {
            onSave: (formData) => {
                const { users: _, ...updates } = formData;
                setSchedule(prev => {
                    saveSchedule({...prev, placeholder: null, ...updates});
                    return {...prev, placeholder: null, ...updates}
                });
                return true;
            },
            refreshTriggers: [['scheduleDrafts', true], ...(schedule ? [['scheduleDraft', schedule.id]] : [])]
        },
    }), [schedule, setSchedule, scopeOptions, saveSchedule, fetchSelectedUsers, isEmpty]);

    const scheduleData = useMemo(() => ({...schedule}), [schedule]);
    
    return <EditForm structure={formStructure} presetData={scheduleData} />;
};

const ScheduleEdit = () => {
    const { appCache } = useAppState();
    const { openModal } = useModals();
    const { scheduleId } = useParams();
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

    const discardChanges = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const saveSchedule = useCallback((schedule) => {
        saveScheduleDraft({ schedule }).then();

        if (isNew.current && isEmpty.current) {
            const { start_date, end_date, user_scope, user_scope_id } = schedule;

            fetchSchedule({start_date, end_date, user_scope, user_scope_id}).then(
                res => isEmpty.current = !res
            );
        }

    }, [saveScheduleDraft, fetchSchedule]);

    const publishSchedule = useCallback((schedule) => {
        //TODO: Create a modal prompt to confirm publishing
        saveScheduleDraft({ schedule, publish: true}).then();

    }, [saveScheduleDraft]);

    const editDetails = useCallback(() => {
        openModal({
            content: 'component',
            type: 'dialog',
            component: <ScheduleEditForm
                schedule={schedule}
                setSchedule={setSchedule}
                saveSchedule={saveSchedule}
                isEmpty={isEmpty}
            />
        });
    }, [openModal, schedule, saveSchedule, setSchedule]);


    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchJobPosts().then();

        let scheduleConfig = {};

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
        isNew.current && isEmpty.current && scheduleConfig.user_scope && fetchSchedule().then();

        setLoading(false);

    }, [isMounted, appCache, params, scheduleId, setSchedule, setLoading, fetchSchedule,
        fetchScheduleDraft, editDetails, fetchJobPosts]);

    console.log("Current schedule:", schedule);

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
                        <Button icon={'publish'} label={'Re-Publish'} onClick={publishSchedule}/>
                    </> : <>
                        <Button icon={'edit'} label={'Edit Details'} onClick={editDetails}/>
                        <Button icon={'save'} label={'Save'} onClick={saveSchedule}/>
                        <Button icon={'publish'} label={'Publish'} onClick={publishSchedule}/>
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