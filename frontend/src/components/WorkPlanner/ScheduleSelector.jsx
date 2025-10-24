// FRONTEND/components/WorkPlanner/ScheduleSelector.jsx
import React, {useCallback, useEffect, useState} from 'react';
import useAppState from '../../contexts/AppStateContext';
import useTeam from '../../hooks/useTeam';
import useUser from '../../hooks/useUser';
import ComboBox from '../ComboBox';
import axios from 'axios';
import {useLocation, useSearchParams} from 'react-router-dom';

const ScheduleSelector = ({ schedule, setSchedule, include_you, include_all, include_teams, include_branches,
                              include_projects, include_specific, include_by_manager, date_range = true,
                              monthly = false, inRow = true }) => {

    const { appState, user } = useAppState();
    const { fetchTeams } = useTeam();
    const { fetchUsers } = useUser();
    const [ groupOptions, setGroupOptions ] = useState([]);
    const [ groupIdOptions, setGroupIdOptions ] = useState([]);
    const { search } = useLocation();
    const [ _, setSearchParams ] = useSearchParams();

    const getUsers = useCallback(async (group, id) => {
        setSchedule(prev => ({...prev, loading: true}));

        if (!id && group !== 'all') {
            setSchedule(prev => ({...prev, users: [], loading: false}));
            if (group === 'team')
                setSchedule(prev => ({...prev, placeholder: 'Select a Team.'}));
            else if (group === 'branch')
                setSchedule(prev => ({...prev, placeholder: 'Select a Branch.'}));
            else if (group === 'project')
                setSchedule(prev => ({...prev, placeholder: 'Select a Project.'}));
            else if (['user', 'manager'].includes(group))
                setSchedule(prev => ({...prev, placeholder: 'Select a User.'}));
            else
                setSchedule(prev => ({...prev, placeholder: 'Select a Group.'}));
            return [];
        }

        let url;

        if (group === 'team') {
            url = `/teams/${id}/users?include_subteams=true`;
        } else if (group === 'branch') {
            url = `/branches/${id}/users`;
        } else if (group === 'project') {
            url = `/projects/${id}/users`;
        } else if (group === 'user') {
            url = `/users/${id}`;
        } else if (group === 'you') {
            url = `/users/${user.id}`;
        } else if (group === 'manager') {
            url = `/users/${id}/managed-users`;
        } else if (group === 'all') {
            url = '/users';
        } else {
            setSchedule(prev => ({...prev, users: [], loading: false}));
            return [];
        }

        try {
            let users = (await axios.get(
                url,
                { withCredentials: true }
            )).data;
            users = Array.isArray(users) ? users : [users];

            const shifts = (await axios.post(
                '/shifts/batch',
                {user: users.map(u => u.id)},
                {withCredentials: true}
            )).data;

            const leaves = (await axios.post(
                '/leaves/batch',
                {user: users.map(u => u.id)},
                {withCredentials: true}
            )).data;

            // TODO: Change those users into map {id: user} with user objects being their ids, names and arrays of shifts and leaves.

            users = users
                .map(user => ({
                    ...user,
                    shifts: shifts.filter(shift => shift.user.id === user.id),
                    leaves: leaves.filter(leave => leave.user.id === user.id)
                }))
                .sort((a, b) => {
                    if (a.hasOwnProperty('team') && b.hasOwnProperty('team')) {
                        if (a.team.id !== b.team.id) {
                            return a.team.id < b.team.id ? -1 : 1;
                        }
                        return a.role.id > b.role.id ? -1 : 1;

                    } else {
                        return (a.last_name + ' ' + a.first_name).localeCompare(b.last_name + ' ' + b.first_name);
                    }
                });

            setSchedule(prev => ({...prev, users: users, placeholder: null, loading: false}));
        } catch (err) {
            console.error('Error fetching users:', err);
            return [];
        }
    }, [user, setSchedule]);

    useEffect(() => {
        const newGroupOptions = [];

        if (include_all)
            newGroupOptions.push({ id: 'all', name: 'All Users' })

        if (include_you)
            newGroupOptions.push({ id: 'you', name: 'Yours' });

        if (include_teams && appState.modules.find((m) => m.title === 'Teams' && m.enabled))
            newGroupOptions.push({ id: 'team', name: 'Team' });

        if (include_branches && appState.modules.find((m) => m.title === 'Branches' && m.enabled))
            newGroupOptions.push({ id: 'branch', name: 'Branch' });

        if (include_projects && appState.modules.find((m) => m.title === 'Projects' && m.enabled))
            newGroupOptions.push({ id: 'project', name: 'Project' });

        if (include_by_manager)
            newGroupOptions.push({ id: 'manager', name: 'Users by Manager' });

        if (include_specific)
            newGroupOptions.push({ id: 'user', name: 'User' });

        setGroupOptions(newGroupOptions);
    }, [appState, include_all, include_you, include_by_manager, include_specific]);

    useEffect(() => {
        if (schedule.group === 'team') {
            fetchTeams(false, true).then(
                (result) => {
                    const teamOptions = result.map((team) => ({id: team.id, name: team.name}));
                    setGroupIdOptions(teamOptions);
                }
            );
        } else if (['user', 'manager'].includes(schedule.group)) {
            fetchUsers(schedule.group === 'manager' ? 'managers' : null).then(
                (result) => {
                    const userOptions = result.map((user) => ({id: user.id, name: user.first_name + ' ' + user.last_name}));
                    setGroupIdOptions(userOptions);
                }
            );
        } else {
            setGroupIdOptions([{id: null, name: 'None'}]);
        }
    }, [schedule.group, fetchTeams, fetchUsers]);

    useEffect(() => {
        getUsers(schedule.group, schedule.groupId).then();
    }, [getUsers, schedule.group, schedule.groupId]);

    const handleChange = useCallback((e) => {
        function isValidDate(d) {
            return d instanceof Date && !Number.isNaN(d.getTime());
        }

        const { name, value } = e.target;

        if (['toDate', 'fromDate'].includes(name)) {
            const date = new Date(value);

            if (!isValidDate(date))
                return;

            setSchedule(prev => ({...prev, [name]: date }));

        } else {
            setSchedule(prev => ({...prev, [name]: value }));
            if (name === 'group') {
                if (value === 'you')
                    setSchedule(prev => ({...prev, groupId: user.id }));
                else
                    setSchedule(prev => ({...prev, groupId: null }));
            }
        }
    }, [search, setSearchParams, schedule, setSchedule, user]);

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
                    name={'group'}
                    searchable={false}
                    value={schedule.group}
                    options={groupOptions}
                    onChange={handleChange}
                    style={{minWidth: '150px'}}
                />
                { schedule.group && !['all', 'you'].includes(schedule.group) && <ComboBox
                    placeholder={`Pick a ${schedule.group}`}
                    name={'groupId'}
                    searchable={true}
                    value={schedule.groupId}
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
                    placeholder={'from date'}
                    name={'fromDate'}
                    value={schedule.fromDate.toISOString().split('T')[0]}
                    max={schedule.toDate.toISOString().split('T')[0]}
                    onChange={handleChange}
                    type={'date'}
                    style={{minWidth: '100px'}}
                />
                <span>-</span>
                <input
                    className={'form-input'}
                    placeholder={'to date'}
                    name={'toDate'}
                    value={schedule.toDate.toISOString().split('T')[0]}
                    min={schedule.fromDate.toISOString().split('T')[0]}
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
