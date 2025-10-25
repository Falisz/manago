// FRONTEND/components/WorkPlanner/ScheduleSelector.jsx
import React, {useCallback, useEffect, useState} from 'react';
import useAppState from '../../contexts/AppStateContext';
import useTeam from '../../hooks/useTeam';
import useUser from '../../hooks/useUser';
import ComboBox from '../ComboBox';
import useShifts from "../../hooks/useShifts";
import useLeaves from "../../hooks/useLeaves";

const ScheduleSelector = ({ schedule, setSchedule, include_you, include_all, include_teams, include_branches,
                              include_projects, include_specific, include_by_manager, date_range = true,
                              monthly = false, inRow = true }) => {

    const { appState, user } = useAppState();
    const { fetchTeams } = useTeam();
    const { fetchUsers } = useUser();
    const { fetchShifts } = useShifts();
    const { fetchLeaves } = useLeaves();
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
        if (schedule.userScope === 'team') {
            fetchTeams(false, true).then(
                (result) => {
                    const teamOptions = result.map((team) => ({id: team.id, name: team.name}));
                    setGroupIdOptions(teamOptions);
                }
            );
        } else if (['user', 'manager'].includes(schedule.userScope)) {
            fetchUsers({group: schedule.userScope === 'manager' ? 'managers' : null}).then(
                (result) => {
                    const userOptions = result.map((user) => (
                        {id: user.id, name: user.first_name + ' ' + user.last_name}
                    ));
                    setGroupIdOptions(userOptions);
                }
            );
        } else {
            setGroupIdOptions([{id: null, name: 'None'}]);
        }
    }, [schedule.userScope, fetchTeams, fetchUsers]);

    useEffect(() => {
        setSchedule(prev => ({...prev, loading: true}));
        let placeholder;

        const userScope = schedule.userScope;
        const scopeId = schedule.scopeId;
        const startDate = schedule.fromDate;
        const endDate = schedule.toDate;

        if (userScope !== 'all' && !scopeId) {
            if (['user', 'manager'].includes(userScope))
                placeholder = 'Select a User.';

            else if (userScope === 'team')
                placeholder = 'Select a Team.';

            else if (userScope === 'branch')
                placeholder = 'Select a Branch.';

            else if (userScope === 'project')
                placeholder = 'Select a Project.';

            setSchedule(prev => ({...prev, users: [], placeholder, loading: false}));
            return;
        }

        const fetchData = async () => {
            let users = new Map();

            if (userScope === 'all')
                users = await fetchUsers({map: true});

            else if (userScope === 'you')
                users = await fetchUsers({userId: user.id, map: true});

            else if (userScope === 'user')
                users = await fetchUsers({userId: scopeId, map: true});

            else if (['manager', 'team', 'branch', 'project'].includes(userScope))
                users = await fetchUsers({userScope, scopeId, map: true});

            if (!users.size) {
                placeholder = 'No Users found.';
                setSchedule(prev => ({ ...prev, users, placeholder, loading: false }));
                return;
            }
            placeholder = null;

            const userIds = Array.from(users.keys());

            const shifts = await fetchShifts({users: userIds, start_date: startDate, end_date: endDate});
            const leaves = await fetchLeaves({users: userIds, start_date: startDate, end_date: endDate});

            users.forEach((user, userId) => {
                user.shifts = shifts
                    .filter(shift => shift.user.id === userId)
                    .map(shift => ({...shift, user: shift.user.id}));
                user.leaves = leaves
                    .filter(leave => leave.user.id === userId)
                    .map(leave => ({...leave, user: leave.user.id}));
            });

            users = new Map(
                [...users.entries()].sort((a, b) => {
                    const userA = a[1];
                    const userB = b[1];

                    if (userA.hasOwnProperty('team') && userB.hasOwnProperty('team'))
                        if (userA.team.id !== userB.team.id)
                            return userA.team.id < userB.team.id ? -1 : 1;
                        else
                            return userA.role.id > userB.role.id ? -1 : 1;

                    else
                        return (userA.last_name + ' ' + userA.first_name)
                            .localeCompare(userB.last_name + ' ' + userB.first_name);

                })
            );

            setSchedule(prev => ({...prev, users, placeholder, loading: false}));
        };

        fetchData().then();

    }, [schedule.userScope, schedule.scopeId, schedule.fromDate, schedule.toDate, fetchUsers, setSchedule, user.id]);

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
            if (name === 'userScope') {
                if (value === 'you')
                    setSchedule(prev => ({...prev, scopeId: user.id }));
                else
                    setSchedule(prev => ({...prev, scopeId: null }));
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
                    name={'userScope'}
                    searchable={false}
                    value={schedule.userScope}
                    options={groupOptions}
                    onChange={handleChange}
                    style={{minWidth: '150px'}}
                />
                { schedule.userScope && !['all', 'you'].includes(schedule.userScope) && <ComboBox
                    placeholder={`Pick a ${schedule.userScope}`}
                    name={'scopeId'}
                    searchable={true}
                    value={schedule.scopeId}
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
