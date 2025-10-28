// FRONTEND/components/WorkPlanner/ScheduleSelector.jsx
import React, {useCallback, useEffect, useState} from 'react';
import useAppState from '../../contexts/AppStateContext';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import ComboBox from '../ComboBox';

const ScheduleSelector = ({ schedule, setSchedule, setLoading, include_you, include_all, include_teams, include_branches,
                              include_projects, include_specific, include_by_manager, date_range = true,
                              monthly = false, inRow = true }) => {

    const { appState, user } = useAppState();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();
    const groupOptions = [
        ...(include_all ?
            [{ id: 'all', name: 'All Users' }] : []),
        ...(include_you ?
            [{ id: 'you', name: 'Yours' }] : []),
        ...(include_teams && appState.modules.find((m) => m.title === 'Teams' && m.enabled) ?
            [{ id: 'team', name: 'Team' }] : []),
        ...(include_branches && appState.modules.find((m) => m.title === 'Branches' && m.enabled) ?
            [{ id: 'branch', name: 'Branch' }] : []),
        ...(include_projects && appState.modules.find((m) => m.title === 'Projects' && m.enabled) ?
            [{ id: 'project', name: 'Project' }] : []),
        ...(include_by_manager ?
            [{ id: 'manager', name: 'Users by Manager' }] : []),
        ...(include_specific ?
            [{ id: 'user', name: 'User' }] : []),
    ];
    const [ groupIdOptions, setGroupIdOptions ] = useState([]);

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({ group: 'manager' }).then();
        fetchTeams({ all: true }).then();
    }, [fetchUsers, fetchManagers, fetchTeams]);

    useEffect(() => {
        if (schedule.user_scope === 'team') {
            const teamOptions = teams.map((team) => (
                {id: team.id, name: team.name}
            ));
            setGroupIdOptions(teamOptions);
        } else if (schedule.user_scope === 'user') {
            const userOptions = users.map((user) => (
                {id: user.id, name: user.first_name + ' ' + user.last_name}
            ));
            setGroupIdOptions(userOptions);
        } else if (schedule.user_scope === 'manager') {
            const managerOptions = managers.map((manager) => (
                {id: manager.id, name: manager.first_name + ' ' + manager.last_name}
            ));
            setGroupIdOptions(managerOptions);  
        } else {
            setGroupIdOptions([{id: null, name: 'None'}]);
        }
    }, [schedule.user_scope, teams, users, managers]);

    const handleChange = useCallback((e) => {
        function isValidDate(d) {
            return d instanceof Date && !Number.isNaN(d.getTime());
        }

        const { name, value } = e.target;

        if (['start_date', 'end_date'].includes(name)) {
            const date = new Date(value);

            if (!isValidDate(date))
                return;

            setSchedule(prev => ({...prev, [name]: date }));

        } else {
            setSchedule(prev => ({...prev, [name]: value }));
            if (name === 'user_scope') {
                if (value === 'you')
                    setSchedule(prev => ({...prev, scope_id: user.id }));
                else
                    setSchedule(prev => ({...prev, scope_id: null }));
            }
        }
    }, [setSchedule, user]);

    return (
        <div
            className={'app-form'}
            style={{
                flexDirection: inRow ? 'row' : 'column',
                alignItems: inRow ? 'center' : 'flex-start',
                gap: '10px'
            }}
        >
            <div className={'form-group'}>
                <label>Users</label>
                <div className={'form-group'} style={{flexDirection: 'row'}}>
                <ComboBox
                    placeholder={'Pick a group'}
                    name={'user_scope'}
                    searchable={false}
                    value={schedule.user_scope}
                    options={groupOptions}
                    onChange={handleChange}
                    style={{minWidth: '150px'}}
                />
                { schedule.user_scope && !['all', 'you'].includes(schedule.user_scope) && <ComboBox
                    placeholder={`Pick a ${schedule.user_scope}`}
                    name={'scope_id'}
                    searchable={true}
                    value={schedule.scope_id}
                    options={groupIdOptions}
                    style={{minWidth: '150px'}}
                    onChange={handleChange}
                />}
                </div>
            </div>
            { date_range && <div className={'form-group'}>
                <label>Date range</label>
                <div className={'form-group'} style={{flexDirection: 'row'}}>
                <input
                    className={'form-input'}
                    name={'start_date'}
                    value={schedule.start_date.toISOString().split('T')[0]}
                    max={schedule.end_date.toISOString().split('T')[0]}
                    onChange={handleChange}
                    type={'date'}
                    style={{minWidth: '100px'}}
                />
                <span>-</span>
                <input
                    className={'form-input'}
                    name={'end_date'}
                    value={schedule.end_date.toISOString().split('T')[0]}
                    min={schedule.start_date.toISOString().split('T')[0]}
                    onChange={handleChange}
                    type={'date'}
                    style={{minWidth: '100px'}}
                />
                </div>
            </div>}
            { monthly && <div className={'form-group'}>
                <label>Month</label>
                <div className={'form-group'} style={{flexDirection: 'row'}}>
                <input
                    className={'form-input'}
                    placeholder={'month'}
                    name={'month'}
                    value={schedule.month}
                    type={'month'}
                    onChange={handleChange}
                />
                </div>
            </div>}
        </div>
    );
}

export default ScheduleSelector;
