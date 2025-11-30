// FRONTEND/components/Schedules/Edit.js
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {Helmet} from 'react-helmet';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useUsers, useTeams, useJobPosts} from '../../hooks/useResource';
import useSchedules from '../../hooks/useSchedules';
import Button from '../Button';
import EditForm from '../EditForm';
import Loader from '../Loader';
import UserSchedule from './UserSchedule';
import '../../styles/Schedules.css';
import Modal from "../Modal";

export const ScheduleEditForm = ({ schedule, setSchedule, handleSave, isNew, isEmpty }) => {
    const { appState } = useApp();
    const navigate = useNavigate();
    const { closeTopModal } = useNav();
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

    const sections = useMemo(() => {
        if (!schedule)
            return {};

        const users = schedule.users?.values() || [];
        const userList = Array.from(users.map(u => u.first_name + ' ' + u.last_name));

        return {
            0: {
                fields: {
                    name: {
                        type: 'string',
                        label: 'Name',
                        required: true,
                    },
                    description: {
                        type: 'textarea',
                        label: 'Description',
                    }
                }
            },
            1: {
                fields: {
                    start_date: {
                        type: 'date',
                        label: 'Start Date',
                        required: true,
                        max: schedule.end_date,
                    },
                    end_date: {
                        type: 'date',
                        label: 'End Date',
                        required: true,
                        min: schedule.start_date,
                    }
                }
            },
            2: {
                style: {alignItems: 'flex-end'},
                fields: {
                    user_scope: {
                        type: 'dropdown',
                        label: 'User Scope',
                        options: scopeOptions.scopes,
                        required: true,
                        disabled: !isEmpty.current,
                        onChange: () => setSchedule((prev) => ({...prev, user_scope_id: null})),
                    },
                    user_scope_id: {
                        type: (['you', 'all'].includes(schedule.user_scope) ? 'hidden' : 'dropdown'),
                        options: schedule.user_scope === 'team' ? scopeOptions.teams :
                            schedule.user_scope === 'manager' ? scopeOptions.managers :
                                schedule.user_scope === 'user' ? scopeOptions.users :
                                    schedule.user_scope === 'project' ? scopeOptions.projects :
                                        schedule.user_scope === 'branch' ? scopeOptions.branches :
                                            [{ id: null, name: 'None'}],
                        required: !['you', 'all'].includes(schedule.user_scope),
                        placeholder: `Select ${schedule.user_scope}`,
                        disabled: !isEmpty.current
                    }
                }
            },
            3: {
                fields: {
                    users: {
                        type: 'content',
                        style: {flexDirection: 'column'},
                        label: `Users (${userList.length})`,
                        content: <span style={{paddingLeft: '10px'}}>{userList.join(', ')}</span>
                    }
                }
            }
        };
    }, [schedule, setSchedule, scopeOptions, isEmpty]);

    const onSubmit = useCallback(async () => {
        for (const field of ['start_date', 'end_date', 'user_scope', 'user_scope_id'])
            if (schedule[field] == null)
                return false;

        await handleSave();

        if (schedule.user_scope && schedule.user_scope_id)
            isEmpty.current = false;

        isNew.current = false;

        closeTopModal();

        return true;
    }, [isEmpty, isNew, handleSave, schedule, closeTopModal]);

    if (!schedule)
        return <Loader/>;
    
    return <EditForm 
        header={isNew.current ? `Creating a new Schedule Draft` : `Editing Details of ${schedule.name}`}
        sections={sections}
        onSubmit={onSubmit}
        onCancel={() => {closeTopModal(); isNew.current && navigate(-1);}}
        submitLabel={schedule?.id ? 'Start planning' : 'Save Changes' }
        source={schedule}
        setSource={setSchedule} 
    />;
};

const ScheduleHeader = ({schedule, mode, discardChanges, openEditForm, handleSave, publishSchedule}) => {

    const title = mode ==='new' ? 'New Schedule Draft' :
        mode === 'current' ? 'Editing Current Schedule' :
            mode === 'draft' ? 'Editing Schedule Draft: ' + schedule?.name : 'Editing Schedule Draft'

    return (
        <div className={'app-schedule-header'}>
            <Helmet>
                <title>{title} | MANAGO</title>
            </Helmet>
            <span style={{marginRight: 'auto', fontSize: '2rem'}}>{title}</span>
            <Button icon={'close'} label={'Discard Changes'} onClick={discardChanges}/>
            { mode === 'current' ? <>
                <Button icon={'save'} label={'Save to Drafts'} onClick={openEditForm}/>
                <Button icon={'publish'} label={'Re-Publish'} onClick={publishSchedule}/>
            </> : <>
                <Button icon={'edit'} label={'Edit Details'} onClick={openEditForm}/>
                <Button icon={'save'} label={'Save'} onClick={handleSave}/>
                <Button icon={'publish'} label={'Publish'} onClick={publishSchedule}/>
            </> }
        </div>
    );
};

const ScheduleEdit = () => {
    const { appCache } = useApp();
    const { setUnsavedChanges } = useNav();
    const { scheduleId } = useParams();
    const {
        schedule,
        setSchedule,
        updateUserShift,
        getSchedule,
        saveSchedule,
        publishSchedule
    } = useSchedules();
    const { jobPosts, fetchJobPosts } = useJobPosts();
    const [ showModal, setShowModal ] = useState(false);
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = useMemo(() => new URLSearchParams(search), [search]);

    const [ mode, setMode ] = useState('new');
    const isNew = useRef(!scheduleId);
    const isEmpty = useRef(true);
    const isMounted = useRef(false);

    const discardChanges = useCallback(() => {
        setUnsavedChanges(false);
        navigate('/schedules');
    }, [navigate, setUnsavedChanges]);

    const openEditForm = useCallback(() => {
        setShowModal(true);
    },[setShowModal]);

    const closeEditForm = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const handleSave = useCallback(async () => {
        setUnsavedChanges(false);
        const success = await saveSchedule({ schedule });
        if (!success) return;
        closeEditForm();
    }, [schedule, setUnsavedChanges, saveSchedule, closeEditForm]);

    useEffect(() => {
        if (scheduleId || !isMounted.current)
            return;

        getSchedule({
            start_date: schedule?.start_date,
            end_date: schedule?.end_date,
            user_scope: schedule?.user_scope,
            user_scope_id: schedule?.user_scope_id
        }).then();
    }, [getSchedule, scheduleId, schedule?.start_date, schedule?.end_date,
        schedule?.user_scope, schedule?.user_scope_id]);

    useEffect(() => {
        if (isMounted.current)
            return;

        isMounted.current = true;

        fetchJobPosts().then();

        if (scheduleId) {
            getSchedule({id: scheduleId}).then();
            setMode('draft');
            isEmpty.current = false;
            return;
        }

        const from = params.get('from');
        const start_date = from && !isNaN(Date.parse(from)) ? from : null;
        const to = params.get('to');
        const end_date = to && !isNaN(Date.parse(to)) ? to : null;
        const user_scope = params.get('scope');
        const sid = params.get('sid');
        const user_scope_id = sid && !isNaN(parseInt(sid)) ? parseInt(sid, 10) : null;
        const paramMissing = !(start_date && end_date && user_scope && user_scope_id);

        getSchedule({start_date, end_date, user_scope, user_scope_id }).then();

        if (paramMissing) {
            setMode('new');
            openEditForm();
        } else {
            setMode('current');
        }

    }, [isMounted, appCache, params, scheduleId, getSchedule, openEditForm, fetchJobPosts]);

    return (
        <div className={'app-schedule seethrough'}>
            <ScheduleHeader
                schedule={schedule}
                mode={mode}
                discardChanges={discardChanges}
                openEditForm={openEditForm}
                handleSave={handleSave}
                publishSchedule={() => publishSchedule(schedule, isNew)}
            />
            {schedule ? <UserSchedule
                schedule={schedule}
                updateUserShift={updateUserShift}
                editable={true}
                jobPosts={jobPosts}
            /> : <Loader/>}
            <Modal
                type={'dialog'}
                onClose={closeEditForm}
                isVisible={showModal}
            >
                <ScheduleEditForm
                    schedule={schedule}
                    setSchedule={setSchedule}
                    handleSave={handleSave}
                    isNew={isNew}
                    isEmpty={isEmpty}
                />
            </Modal>
        </div>
    );
}

export default ScheduleEdit;