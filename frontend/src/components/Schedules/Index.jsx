// FRONTEND/Components/Schedules/Index.jsx
import React, {useCallback, useEffect, useState} from 'react';
import ComboBox from "../ComboBox";
import Loader from "../Loader";
import axios from "axios";
import useAppState from "../../contexts/AppStateContext";
import useTeam from "../../hooks/useTeam";
import useUser from "../../hooks/useUser";
import {useModals} from "../../contexts/ModalContext";

const generateDateList = (fromDate, toDate) => {
    const dates = [];
    const currentDate = new Date(fromDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return dates;
};

const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const sameDay = (date1, date2) => {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
};

const Shift = ({ time, role, color }) => (
    <div className={'shift-item'} style={{background: color+'90'}}>
        <span>{time}</span>
        <span className={'subtitle'}>{role}</span>
    </div>
);

const Leave = ({ days, type, color }) => (
    <div className={'leave-item'} >
        <span>{days || 1}-day{days > 1 ? 's' : ''} Leave</span>
        <span className={'subtitle'} style={{color}}>{type}</span>
    </div>
);

const ScheduleHeader = ({scheduleConfig, setScheduleConfig}) => {

    const { appState, user } = useAppState();
    const { fetchTeams } = useTeam();
    const { fetchUsers } = useUser();
    const [groupOptions, setGroupOptions] = useState([
        { id: 'all', name: 'All User' },
        { id: 'you', name: 'Yours' },
    ]);const [groupIdOptions, setGroupIdOptions] = useState([]);

    useEffect(() => {
        const newGroupOptions = [
            { id: 'all', name: 'All Users' },
            { id: 'you', name: 'Yours' },
        ];

        if (appState.modules.find((m) => m.title === 'Teams' && m.enabled)) {
            newGroupOptions.push({ id: 'team', name: 'Team' });
        }
        if (appState.modules.find((m) => m.title === 'Branches' && m.enabled)) {
            newGroupOptions.push({ id: 'branch', name: 'Branch' });
        }
        if (appState.modules.find((m) => m.title === 'Projects' && m.enabled)) {
            newGroupOptions.push({ id: 'project', name: 'Project' });
        }
        newGroupOptions.push({ id: 'employee', name: 'Employee' });
        newGroupOptions.push({ id: 'manager', name: 'Manager' });
        newGroupOptions.push({ id: 'user', name: 'User' });

        setGroupOptions(newGroupOptions);
    }, [appState.modules]);

    useEffect(() => {
        if (scheduleConfig.group === 'team') {
            fetchTeams(false, true).then(
                (result) => {
                    const teamOptions = result.map((team) => ({id: team.id, name: team.name}));
                    setGroupIdOptions(teamOptions);
                }
            );
        } else if (['user', 'employee', 'manager'].includes(scheduleConfig.group)) {
            fetchUsers(scheduleConfig.group === 'user' ? null : scheduleConfig.group).then(
                (result) => {
                    const userOptions = result.map((user) => ({id: user.id, name: user.first_name + ' ' + user.last_name}));
                    setGroupIdOptions(userOptions);
                }
            );
        } else {
            setGroupIdOptions([]);
        }
    }, [scheduleConfig.group, fetchTeams]);

    function handleChange (e) {
        function isValidDate(d: Date): boolean {
            return d instanceof Date && !Number.isNaN(d.getTime());
        }

        const { name, value } = e.target;

        if (['toDate', 'fromDate'].includes(name)) {
            const date = new Date(value);

            if (!isValidDate(date))
                return;

            setScheduleConfig(prev => ({...prev, [name]: date }));

        } else {
            setScheduleConfig(prev => ({...prev, [name]: value }));
            if (name === 'group') {
                if (value === 'you')
                    setScheduleConfig(prev => ({...prev, groupId: user.id }));
                else
                    setScheduleConfig(prev => ({...prev, groupId: null }));
            }
        }
    }

    return (
        <div className={'app-schedule-header app-form'}>
            <h1>Schedule</h1>
            <ComboBox
                placeholder={'Pick a group'}
                name={'group'}
                searchable={false}
                value={scheduleConfig.group}
                options={groupOptions}
                onChange={handleChange}
                style={{minWidth: '150px'}}
            />
            { !['all', 'you'].includes(scheduleConfig.group) && <ComboBox
                placeholder={`Pick a ${scheduleConfig.group}`}
                name={'groupId'}
                searchable={true}
                value={scheduleConfig.groupId}
                options={groupIdOptions}
                style={{minWidth: '150px'}}
                onChange={handleChange}
            />}
            <span>From:</span>
            <input
                className={'form-input'}
                placeholder={'from date'}
                name={'fromDate'}
                value={scheduleConfig.fromDate.toISOString().split('T')[0]}
                max={scheduleConfig.toDate.toISOString().split('T')[0]}
                onChange={handleChange}
                type={'date'}
                style={{minWidth: '100px'}}
            />
            <span>To:</span>
            <input
                className={'form-input'}
                placeholder={'to date'}
                name={'toDate'}
                value={scheduleConfig.toDate.toISOString().split('T')[0]}
                min={scheduleConfig.fromDate.toISOString().split('T')[0]}
                onChange={handleChange}
                type={'date'}
                style={{minWidth: '100px'}}
            />
        </div>
    );
};

const Schedule = ({dates, users, placeholder, loading}) => {
    const { openModal } = useModals();

    const handleMouseEnter = (e) => {
        const cellIndex = e.currentTarget.cellIndex;
        if (cellIndex >= 0) {
            document.querySelectorAll(`td:nth-child(${cellIndex + 1}), th:nth-child(${cellIndex + 1})`)
                .forEach(cell => cell.classList.add('column-highlight'));
        }
    };

    const handleMouseLeave = (e) => {
        const cellIndex = e.currentTarget.cellIndex;
        if (cellIndex >= 0) {
            document.querySelectorAll(`td:nth-child(${cellIndex + 1}), th:nth-child(${cellIndex + 1})`)
                .forEach(cell => cell.classList.remove('column-highlight'));
        }
    };

    const holidays = [
        {
            date: new Date('2025-10-31'),
            name: 'Holiday #2'
        },
        {
            date: new Date('2025-10-16'),
            name: 'Holiday #1'
        }
    ]

    if (loading)
        return <Loader/>;

    return <div className={'app-schedule-content app-scroll'}>
        <table className={'app-schedule-table'}>
            <thead>
            <tr>
                <th className={'user-header'}>
                    User
                </th>
                {dates?.map((date) => {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayIdx = date.getUTCDay();
                    const shortDay = dayNames[dayIdx];
                    const formattedDate = formatDate(date);

                    const isDate = holidays.find(holiday => sameDay(holiday.date, date));

                    return (
                        <th
                            key={formattedDate}
                            className={'day-header' + (dayIdx === 0 || dayIdx === 6 ? ' weekend' :
                                isDate ? ' holiday' : '')}
                            onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                        >
                            <div className='date'>{formattedDate}</div>
                            <div className='short-day' title={dayIdx === 0 || dayIdx === 6 ? 'Weekend' :
                                isDate ? isDate.name : ''}>{shortDay}</div>
                        </th>
                    );
                })}
            </tr>
            </thead>
            <tbody>
            {placeholder && <tr>
            <td colSpan={dates.length + 1} style={{fontStyle: 'italic', textAlign: 'center'}}>{placeholder}</td>
            </tr>}
            {users?.map((user) => {
                return <tr key={user.id}>
                        <td className={'user-cell'}>
                            <span
                                className={'app-clickable'}
                                style={{fontWeight: 'bold'}}
                                onClick={() =>  openModal({content: 'userDetails', contentId: user.id}) }
                            >
                                {user.first_name} {user.last_name}
                            </span>
                            {user.team && <><br/><small>{user.team.name}: {user.role.name}</small></>}
                        </td>
                        {dates?.map((date, dateIndex) => {
                            const formattedDate = formatDate(date);

                            const shift = user.shifts?.filter((s) =>
                                sameDay(new Date(s.start_time), date)
                            ) || [];

                            const leave = user.leaves?.find(
                                (l) =>
                                    l.user === user.id &&
                                    date >= new Date(l.startDate) &&
                                    date <= new Date(l.endDate)
                            );
                            const isLeaveStart = leave ? sameDay(date, new Date(leave.startDate)) : false;

                            if (leave && !isLeaveStart) {
                                return null;
                            }

                            let totalDays;

                            let colSpan = 1;
                            if (isLeaveStart) {
                                const dayDiff = (a, b) =>
                                    Math.round((b - a) / (1000 * 60 * 60 * 24));

                                totalDays =
                                    dayDiff(
                                        new Date(
                                            Date.UTC(
                                                leave.startDate.getUTCFullYear(),
                                                leave.startDate.getUTCMonth(),
                                                leave.startDate.getUTCDate()
                                            )
                                        ),
                                        new Date(
                                            Date.UTC(
                                                leave.endDate.getUTCFullYear(),
                                                leave.endDate.getUTCMonth(),
                                                leave.endDate.getUTCDate()
                                            )
                                        )
                                    ) + 1;
                                const remainingColumns = dates.length - dateIndex;
                                colSpan = Math.max(1, Math.min(totalDays, remainingColumns));
                            }

                            const key = `${user.id}-${formattedDate}`;

                            return (
                                <td
                                    key={key}
                                    colSpan={colSpan}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {shift.length > 0 ? (
                                        shift.map((s, si) => (
                                            <Shift
                                                key={si}
                                                time={`${new Date(s.start_time).toLocaleTimeString('pl-PL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false,
                                                })} - ${new Date(s.end_time).toLocaleTimeString('pl-PL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false,
                                                })}`}
                                                role={s.job_post.name}
                                                color={s.job_post.color}
                                            />
                                        ))
                                    ) : isLeaveStart ? (
                                        <Leave days={totalDays} type={leave.type} />
                                    ) : null}
                                </td>
                            );
                        })}
                    </tr>;
            })}
            </tbody>
        </table>
    </div>
};

const ScheduleIndex = () => {
    const { user } = useAppState();
    const [loading, setLoading] = useState(true);
    const [placeholder, setPlaceholder] = useState(null)

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const inSixDays = new Date(today);
    inSixDays.setDate(today.getDate() + 6);

    const [scheduleConfig, setScheduleConfig] = useState({
        fromDate: yesterday,
        toDate: inSixDays,
        group: 'you',
        groupId: user.id
    });

    const [users, setUsers] = useState([]);

    const getUsers = useCallback(async (group, id) => {
        setLoading(true);

        if (!id && group !== 'all') {
            setUsers([]);
            setLoading(false);
            if (group === 'team')
                setPlaceholder('Select a Team.');
            else if (group === 'branch')
                setPlaceholder('Select a Branch.');
            else if (group === 'project')
                setPlaceholder('Select a Project.');
            else if (['user', 'employee', 'manager'].includes(group))
                setPlaceholder('Select a User.');
            else
                setPlaceholder('Select a Group.');
            return [];
        }

        let url;

        if (group === 'team') {
            url = `/teams/${id}/users?include_subteams=true`;
        } else if (group === 'branch') {
            url = `/branches/${id}/users`;
        } else if (group === 'project') {
            url = `/projects/${id}/users`;
        } else if (['user', 'employee', 'manager', 'you'].includes(group)) {
            url = `/users/${id}`;
        } else if (group === 'all') {
            url = '/users';
        } else {
            setUsers([]);
            setLoading(false);
            return [];
        }

        try {
            let users = (await axios.get(
                url,
                { withCredentials: true }
            )).data;

            users = Array.isArray(users) ? users : [users];

            const shifts = (await axios.post(
                '/shifts/bulk',
                {user: users.map(u => u.id)},
                {withCredentials: true}
            )).data;

            users = users
                .map(user => ({
                    ...user,
                    shifts: shifts.filter(shift => shift.user.id === user.id),
                    leaves: []
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

            setUsers(users);
            setPlaceholder(null);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            return [];
        }
    }, []);

    useEffect(() => {
        getUsers(scheduleConfig.group, scheduleConfig.groupId).then();
    }, [getUsers, scheduleConfig]);

    const dates = generateDateList(scheduleConfig.fromDate, scheduleConfig.toDate);

    return <div className={'app-schedule seethrough'}>
        <ScheduleHeader
            scheduleConfig={scheduleConfig}
            setScheduleConfig={setScheduleConfig}
        />
        <Schedule
            dates={dates}
            users={users}
            placeholder={placeholder}
            loading={loading}
        />
    </div>
};

export default ScheduleIndex;