// FRONTEND/components/Test.jsx
import React, {useCallback, useEffect, useState} from 'react';
import '../styles/Schedule.css';
import axios from "axios";
import ComboBox from "./ComboBox";
import Loader from "./Loader";


const Shift = ({ time, role, draggableProps, color}) => (
    <div
        {...draggableProps}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '10px',
            borderRadius: 8,
            background: 'var(--seethrough-background-3)',
            fontSize: 12,
            color: 'var(--text-color-3)',
            whiteSpace: 'nowrap',
        }}
    >
        <strong>{time}</strong>
        <span style={{
            alignSelf: 'flex-end',
            color: color,
            fontStyle: 'italic',
            fontWeight: 'bold'
        }}>{role}</span>
    </div>
);

const Leave = ({ days, type }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '4px 8px',
            borderRadius: 8,
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            fontSize: 12,
            color: '#1f2937',
            whiteSpace: 'nowrap',
        }}
    >
        <strong>{days || 1}-day{days > 1 ? 's' : ''} Leave</strong>
        <span style={{
            alignSelf: 'flex-end',
        }}>{type}</span>
    </div>
);

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

const sameDay = (date1, date2) => {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
};

const Schedule = ({}) => {
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const inSixDays = new Date(today);
    inSixDays.setDate(today.getDate() + 6);

    const [scheduleConfig, setScheduleConfig] = useState({
        fromDate: yesterday,
        toDate: inSixDays,
        group: 'all',
        groupId: null
    });

    const [users, setUsers] = useState([]);

    const getTeamUsers = useCallback(async (team) => {
        try {
            const res = await axios.get('/teams/' + team + '/users?include_subteams=true', { withCredentials: true });
            console.log(res.data);
            const users = await Promise.all(
                res.data.map(async (u) => ({
                    ...u,
                    shifts: (await axios.get(`/shifts?user=${u.id}`, { withCredentials: true })).data,
                    leaves: []
                }))
            );
            setUsers(users);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            return [];
        }
    }, []);

    useEffect(() => {
        if (!users || users.length === 0)
            getTeamUsers(1).then();
    }, [users, getTeamUsers]);

    const dates = generateDateList(scheduleConfig.fromDate, scheduleConfig.toDate);

    const formatDate = (date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const groupOptions = [
        { id: 'all', name: 'All' },
        { id: 'you', name: 'Yours' },
        { id: 'project', name: 'Project' },
        { id: 'branch', name: 'Branch' },
        { id: 'team', name: 'Team' },
        { id: 'user', name: 'User' }
    ];

    if (loading)
        return <Loader/>;

    return <div className={'app-schedule seethrough'}>
        <div className={'app-schedule-header app-form'}>
            <h1>Schedule</h1>
            <ComboBox
                placeholder={'Pick a group'}
                name={'group'}
                searchable={false}
                value={scheduleConfig.group}
                options={groupOptions}
                onChange={(e) => {setScheduleConfig(prev => ({...prev, group: e.target.value }))}}
                style={{minWidth: '100px'}}
            />
            <span>From:</span>
            <input
                className={'form-input'}
                placeholder={'from date'}
                name={'fromDate'}
                value={scheduleConfig.fromDate.toISOString().split('T')[0]}
                onChange={(e) => {setScheduleConfig(prev => ({...prev, fromDate: new Date(e.target.value)}))}}
                type={'date'}
                style={{minWidth: '100px'}}
            />
            <span>To:</span>
            <input
                className={'form-input'}
                placeholder={'to date'}
                name={'toDate'}
                value={scheduleConfig.toDate.toISOString().split('T')[0]}
                onChange={(e) => {setScheduleConfig(prev => ({...prev, toDate: new Date(e.target.value)}))}}
                type={'date'}
                style={{minWidth: '100px'}}
            />
        </div>
        <div className={'app-schedule-content'}>
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

                        return (
                            <th
                                key={formattedDate}
                                className={'day-header' + (dayIdx === 0 || dayIdx === 6 ? ' weekend' : '')}
                            >
                                <div className='date'>{formattedDate}</div>
                                <div className='short-day'>{shortDay}</div>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {users?.map((user) => {
                    return <tr key={user.id}>
                        <td className={'user-cell'}>
                            {user.first_name} {user.last_name}
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
                                <td key={key} colSpan={colSpan}>
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
                    </tr>
                })}
                </tbody>
            </table>
        </div>
    </div>
}

const Test = () => {
    // const [users, setUsers] = useState([]);
    // const [shifts, setShifts] = useState([]);
    //
    // const getTeamUsers = useCallback(async (team) => {
    //     try {
    //         const res = await axios.get('/teams/' + team + '/users?include_subteams=true', { withCredentials: true });
    //         setUsers(res.data);
    //     } catch (err) {
    //         console.error('Error fetching users:', err);
    //         return [];
    //     }
    // }, []);
    //
    // const getShifts = useCallback(async () => {
    //     try {
    //         const res = await axios.get('/shifts', { withCredentials: true });
    //         setShifts(res.data);
    //     } catch (err) {
    //         console.error('Error fetching shifts:', err);
    //     }
    // }, [])
    //
    // useEffect(() => {
    //     if (!users || users.length === 0)
    //         getTeamUsers(1).then();
    //     if (!shifts || shifts.length === 0)
    //         getShifts(1).then();
    // }, [users, getTeamUsers, shifts, getShifts]);
    //
    //
    // const dates = listDatesInRange('2025-10-01', '2025-10-07');
    //
    // const dragPreviewRef = useRef(null);
    //
    // const leaves = [
    //     {
    //         user: 100004,
    //         startDate: new Date('2025-10-05'),
    //         endDate: new Date('2025-10-09'),
    //         type: 'Annual Leave'
    //     }
    // ]
    //
    // const toUTCDate = (s) => new Date(`${s}T00:00:00Z`);
    //
    // const sameDay = (a, b) =>
    //     a.getUTCFullYear() === b.getUTCFullYear() &&
    //     a.getUTCMonth() === b.getUTCMonth() &&
    //     a.getUTCDate() === b.getUTCDate();
    //
    // const makeShiftDragHandlers = (shift) => ({
    //     draggable: true,
    //     onDragStart: (e) => {
    //         e.dataTransfer.effectAllowed = 'copyMove';
    //         const payload = JSON.stringify({
    //             type: 'shift',
    //             startTime: shift.startTime,
    //             endTime: shift.endTime,
    //             role: shift.role,
    //             sourceUser: shift.user,
    //             sourceDate: new Date(shift.start_time).toISOString(),
    //         });
    //         e.dataTransfer.setData('application/json', payload);
    //
    //         const target = e.currentTarget;
    //         const clone = target.cloneNode(true);
    //         clone.style.pointerEvents = 'none';
    //         clone.style.position = 'fixed';
    //         clone.style.top = '-1000px';
    //         clone.style.right = '-1000px';
    //         document.body.appendChild(clone);
    //         dragPreviewRef.current = clone;
    //         try {
    //             e.dataTransfer.setDragImage(clone, 10, 10);
    //         } catch {}
    //     },
    //     onDragEnd: () => {
    //         if (dragPreviewRef.current) {
    //             dragPreviewRef.current.remove();
    //             dragPreviewRef.current = null;
    //         }
    //     },
    // });
    //
    // const handleCellDrop = (user, dateStr) => (e) => {
    //     e.preventDefault();
    //     const data = e.dataTransfer.getData('application/json');
    //     if (!data) return;
    //     let parsed;
    //     try {
    //         parsed = JSON.parse(data);
    //     } catch {
    //         return;
    //     }
    //     if (parsed?.type !== 'shift') return;
    //
    //     const targetDate = toUTCDate(dateStr);
    //     const targetUser = user;
    //
    //     const isCopy = !!(e.ctrlKey || e.metaKey);
    //
    //     const newShift = {
    //         user: targetUser,
    //         date: targetDate,
    //         startTime: parsed.startTime,
    //         endTime: parsed.endTime,
    //         role: parsed.role,
    //     };
    //
    //     setShifts((prev) => {
    //
    //         const hasLeaveOnTargetDay = leaves.some(
    //             (l) =>
    //                 l.user === targetUser &&
    //                 targetDate >= new Date(Date.UTC(l.startDate.getUTCFullYear(), l.startDate.getUTCMonth(), l.startDate.getUTCDate())) &&
    //                 targetDate <= new Date(Date.UTC(l.endDate.getUTCFullYear(), l.endDate.getUTCMonth(), l.endDate.getUTCDate()))
    //         );
    //
    //         const sourceDate = new Date(parsed.sourceDate);
    //         const isSameCellAsSource =
    //             parsed.sourceUser === targetUser && sameDay(sourceDate, targetDate);
    //
    //         if (isCopy) {
    //             if (hasLeaveOnTargetDay) return prev;
    //             return [...prev, newShift];
    //         } else {
    //             if (isSameCellAsSource) return prev;
    //             if (hasLeaveOnTargetDay) return prev;
    //
    //             const withoutSource = prev.filter(
    //                 (s) =>
    //                     !(
    //                         s.user === parsed.sourceUser &&
    //                         sameDay(s.date, sourceDate) &&
    //                         s.startTime === parsed.startTime &&
    //                         s.endTime === parsed.endTime &&
    //                         s.role === parsed.role
    //                     )
    //             );
    //             return [...withoutSource, newShift];
    //         }
    //     });
    // };
    //
    // const handleCellDragOver = (user, dateStr) => (e) => {
    //     e.preventDefault();
    //     const targetDate = toUTCDate(dateStr);
    //
    //     const hasLeaveOnTargetDay = leaves.some(
    //         (l) =>
    //             l.user === user &&
    //             targetDate >= new Date(Date.UTC(l.startDate.getUTCFullYear(), l.startDate.getUTCMonth(), l.startDate.getUTCDate())) &&
    //             targetDate <= new Date(Date.UTC(l.endDate.getUTCFullYear(), l.endDate.getUTCMonth(), l.endDate.getUTCDate()))
    //     );
    //
    //     if (hasLeaveOnTargetDay) {
    //         e.dataTransfer.dropEffect = 'none';
    //     } else {
    //         e.dataTransfer.dropEffect = (e.ctrlKey || e.metaKey) ? 'copy' : 'move';
    //     }
    // };

    return (
        <>
            <Schedule />
            {/*<div className={'seethrough'} style={{ padding: '20px', width: '100%', height: '100%',*/}
            {/*    overflow: 'hidden', borderRadius: 'var(--def-border-radius)' }}>*/}

            {/*    <h2 style={{ margin: 0 }}>Weekly Test Schedule</h2>*/}
            {/*    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>*/}
            {/*        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>*/}
            {/*            <thead>*/}
            {/*            <tr>*/}
            {/*                <th*/}
            {/*                    style={{*/}
            {/*                        textAlign: 'left',*/}
            {/*                        padding: '8px 12px',*/}
            {/*                        borderBottom: '2px solid #e5e7eb',*/}
            {/*                        width: 160,*/}
            {/*                    }}*/}
            {/*                >*/}
            {/*                    User*/}
            {/*                </th>*/}
            {/*                {dates.map((dateStr) => {*/}
            {/*                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];*/}
            {/*                    const dayIdx = new Date(`${dateStr}T00:00:00Z`).getUTCDay();*/}
            {/*                    const shortDay = dayNames[dayIdx];*/}

            {/*                    return (*/}
            {/*                        <th*/}
            {/*                            key={dateStr}*/}
            {/*                            style={{*/}
            {/*                                textAlign: 'center',*/}
            {/*                                padding: '8px 12px',*/}
            {/*                                borderBottom: '2px solid #e5e7eb',*/}
            {/*                            }}*/}
            {/*                        >*/}
            {/*                            <div>{dateStr}</div>*/}
            {/*                            <div style={{ fontSize: 12, color: 'var(--text-color-3)', marginBottom: 2 }}>{shortDay}</div>*/}
            {/*                        </th>*/}
            {/*                    );*/}
            {/*                })}*/}

            {/*            </tr>*/}
            {/*            </thead>*/}
            {/*            <tbody>*/}
            {/*            {users.map((u) => (*/}
            {/*                <tr key={u.id}>*/}
            {/*                    <td*/}
            {/*                        style={{*/}
            {/*                            padding: '10px 12px',*/}
            {/*                            borderBottom: '1px solid #f3f4f6',*/}
            {/*                            fontWeight: 600,*/}
            {/*                        }}*/}
            {/*                    >*/}
            {/*                        {u.first_name} {u.last_name}*/}
            {/*                    </td>*/}
            {/*                    {dates.map((dateStr, di) => {*/}
            {/*                        const d = toUTCDate(dateStr);*/}

            {/*                        const shift = shifts.filter(s =>*/}
            {/*                            s.user.id === u.id && sameDay(new Date(s.start_time), d)*/}
            {/*                        );*/}

            {/*                        const leave = leaves.find(l =>*/}
            {/*                            l.user === u.id && d >= l.startDate && d <= l.endDate*/}
            {/*                        );*/}

            {/*                        const isLeaveStart = leave ? sameDay(d, leave.startDate) : false;*/}

            {/*                        if (leave && !isLeaveStart) {*/}
            {/*                            return null;*/}
            {/*                        }*/}

            {/*                        let totalDays;*/}
            {/*                        let colSpan = 1;*/}
            {/*                        if (isLeaveStart) {*/}
            {/*                            const dayDiff = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));*/}
            {/*                            totalDays = dayDiff(*/}
            {/*                                new Date(Date.UTC(leave.startDate.getUTCFullYear(), leave.startDate.getUTCMonth(), leave.startDate.getUTCDate())),*/}
            {/*                                new Date(Date.UTC(leave.endDate.getUTCFullYear(), leave.endDate.getUTCMonth(), leave.endDate.getUTCDate()))*/}
            {/*                            ) + 1;*/}

            {/*                            const remainingColumns = dates.length - di;*/}
            {/*                            colSpan = Math.max(1, Math.min(totalDays, remainingColumns));*/}
            {/*                        }*/}

            {/*                        const key = `${u}-${dateStr}`;*/}

            {/*                        const cellStyle = {*/}
            {/*                            padding: '10px 12px',*/}
            {/*                            borderBottom: '1px solid #f3f4f6',*/}
            {/*                            textAlign: 'center',*/}
            {/*                        };*/}

            {/*                        return (*/}
            {/*                            <td*/}
            {/*                                key={key}*/}
            {/*                                style={cellStyle}*/}
            {/*                                colSpan={colSpan}*/}
            {/*                                onDragOver={handleCellDragOver(u.id, dateStr)}*/}
            {/*                                onDrop={handleCellDrop(u.id, dateStr)}*/}
            {/*                            >*/}
            {/*                                {shift.length > 0 ?*/}
            {/*                                    shift.map((s, si) => <Shift*/}
            {/*                                        key={si}*/}
            {/*                                        time={`${new Date(s.start_time).toLocaleTimeString('pl-PL', {hour: '2-digit',*/}
            {/*                                            minute: '2-digit',*/}
            {/*                                            hour12: false*/}
            {/*                                        })} - ${new Date(s.end_time).toLocaleTimeString('pl-PL', {hour: '2-digit',*/}
            {/*                                            minute: '2-digit',*/}
            {/*                                            hour12: false*/}
            {/*                                        })}`}*/}
            {/*                                        role={s.job_post.name}*/}
            {/*                                        color={s.job_post.color}*/}
            {/*                                        draggableProps={makeShiftDragHandlers(s)}*/}
            {/*                                    />)*/}
            {/*                                : isLeaveStart ? (*/}
            {/*                                    <Leave days={totalDays} type={leave.type} />*/}
            {/*                                ) : null}*/}
            {/*                            </td>*/}
            {/*                        );*/}
            {/*                    })}*/}
            {/*                </tr>*/}
            {/*            ))}*/}
            {/*            </tbody>*/}
            {/*        </table>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </>
    );
};

export default Test;