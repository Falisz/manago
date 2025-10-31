// FRONTEND/components/ScheduleDraft/Edit.js
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSchedules from '../../hooks/useSchedules';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import Loader from '../Loader';
import EditForm from '../EditForm';
import useAppState from '../../contexts/AppStateContext';

const ScheduleDraftEdit = ({ scheduleId }) => {
    const { appState, setScheduleEditor } = useAppState();
    const navigate = useNavigate();
    const { scheduleDraft, loading, setLoading, fetchScheduleDraft, saveScheduleDraft } = useSchedules();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();
    
        if (scheduleId) {
            setLoading(true);
            fetchScheduleDraft({ scheduleId, include_shifts: true })
        } else {
            setLoading(false);
        }
    }, [fetchUsers, fetchManagers, fetchTeams, scheduleId, fetchScheduleDraft, setLoading]);

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
            title: scheduleId ? `Editing ${scheduleDraft?.name}` : `Creating a new Schedule Draft`,
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
            },
            end_date: {
                section: 1,
                field: 'end_date',
                type: 'date',
                inputType: 'date',
                label: 'End Date',
                required: true,
            },
            user_scope: {
                section: 2,
                field: 'user_scope',
                type: 'string',
                inputType: 'dropdown',
                label: 'User Scope',
                options: scopeOptions.scopes,
                required: true,
            },
            user_scope_id: {
                section: 2,
                field: 'user_scope_id',
                conditional_type: (formData) => ['you', 'all'].includes(formData.user_scope) ? 'hidden' : 'number',
                inputType: 'dropdown',
                options: [],
                conditional_options: (formData) => formData.user_scope === 'team' ? scopeOptions.teams :
                            formData.user_scope === 'manager' ? scopeOptions.managers :
                            formData.user_scope === 'user' ? scopeOptions.users : [],
                conditional_required: (formData) => !['you', 'all'].includes(formData.user_scope),
            }
        },
        onSubmit: {
            onSave: (formData, id) => { 
                const schedule = saveScheduleDraft({scheduleId: id, formData});
                if (schedule) {
                    setScheduleEditor({
                        ...schedule,
                        type: 'new'
                    });
                    navigate('/planner/editor');
                }
            },
            refreshTriggers: [['scheduleDrafts', true], ...(scheduleDraft ? [['scheduleDraft', scheduleDraft.id]] : [])]
        },
    }), [scheduleDraft, scopeOptions, scheduleId, saveScheduleDraft, setScheduleEditor, navigate]);

    const scheduleData = useMemo(() => ({...scheduleDraft}), [scheduleDraft]);

    if (loading)
        return <Loader/>;
    
    return <EditForm structure={formStructure} presetData={scheduleData} />;
};

export default ScheduleDraftEdit;