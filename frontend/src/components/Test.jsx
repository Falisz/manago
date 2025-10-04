// FRONTEND/components/Test.jsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import axios from "axios";

function listDatesInRange(start, end) {

    const toDate = (v) => {
        if (v instanceof Date) return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
        if (typeof v === 'string') {
            const [y, m, d] = v.split('-').map(Number);
            return new Date(Date.UTC(y, (m - 1), d));
        }
    };

    const format = (dt) => {
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dt.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    if (!start)
        return [];

    const startDate = toDate(start);
    const endDate = end ? toDate(end) : new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + 6));

    if (endDate < startDate)
        return [];

    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
        dates.push(format(d));
    }
    return dates;
}


const Shift = ({ time, role, draggableProps}) => (
    <div
        {...draggableProps}
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
        <strong>{time}</strong>
        <span style={{
            alignSelf: 'flex-end',
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

const Test = () => {
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);

    const getTeamUsers = useCallback(async (team) => {
        try {
            const res = await axios.get('/teams/' + team + '/users?include_subteams=true', { withCredentials: true });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            return [];
        }
    }, []);

    const getShifts = useCallback(async () => {
        try {
            const res = await axios.get('/shifts', { withCredentials: true });
            setShifts(res.data);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    }, [])

    useEffect(() => {
        if (!users || users.length === 0)
            getTeamUsers(1).then();
        if (!shifts || shifts.length === 0)
            getShifts(1).then();
    }, [users, getTeamUsers, shifts, getShifts]);

    console.log(users, shifts);

    const dates = listDatesInRange('2025-10-01', '2025-10-07');

    const dragPreviewRef = useRef(null);

    const leaves = [
        {
            user: 100004,
            startDate: new Date('2025-10-05'),
            endDate: new Date('2025-10-09'),
            type: 'Annual Leave'
        }
    ]

    const toUTCDate = (s) => new Date(`${s}T00:00:00Z`);

    const sameDay = (a, b) =>
        a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate();

    const makeShiftDragHandlers = (shift) => ({
        draggable: true,
        onDragStart: (e) => {
            e.dataTransfer.effectAllowed = 'copyMove';
            const payload = JSON.stringify({
                type: 'shift',
                startTime: shift.startTime,
                endTime: shift.endTime,
                role: shift.role,
                sourceUser: shift.user,
                sourceDate: shift.date.toISOString(),
            });
            e.dataTransfer.setData('application/json', payload);

            const target = e.currentTarget;
            const clone = target.cloneNode(true);
            clone.style.pointerEvents = 'none';
            clone.style.position = 'fixed';
            clone.style.top = '-1000px';
            clone.style.right = '-1000px';
            document.body.appendChild(clone);
            dragPreviewRef.current = clone;
            try {
                e.dataTransfer.setDragImage(clone, 10, 10);
            } catch {}
        },
        onDragEnd: () => {
            if (dragPreviewRef.current) {
                dragPreviewRef.current.remove();
                dragPreviewRef.current = null;
            }
        },
    });

    const handleCellDrop = (user, dateStr) => (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch {
            return;
        }
        if (parsed?.type !== 'shift') return;

        const targetDate = toUTCDate(dateStr);
        const targetUser = user;

        const isCopy = !!(e.ctrlKey || e.metaKey);

        const newShift = {
            user: targetUser,
            date: targetDate,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            role: parsed.role,
        };

        setShifts((prev) => {

            const hasLeaveOnTargetDay = leaves.some(
                (l) =>
                    l.user === targetUser &&
                    targetDate >= new Date(Date.UTC(l.startDate.getUTCFullYear(), l.startDate.getUTCMonth(), l.startDate.getUTCDate())) &&
                    targetDate <= new Date(Date.UTC(l.endDate.getUTCFullYear(), l.endDate.getUTCMonth(), l.endDate.getUTCDate()))
            );

            const sourceDate = new Date(parsed.sourceDate);
            const isSameCellAsSource =
                parsed.sourceUser === targetUser && sameDay(sourceDate, targetDate);

            if (isCopy) {
                if (hasLeaveOnTargetDay) return prev;
                return [...prev, newShift];
            } else {
                if (isSameCellAsSource) return prev;
                if (hasLeaveOnTargetDay) return prev;

                const withoutSource = prev.filter(
                    (s) =>
                        !(
                            s.user === parsed.sourceUser &&
                            sameDay(s.date, sourceDate) &&
                            s.startTime === parsed.startTime &&
                            s.endTime === parsed.endTime &&
                            s.role === parsed.role
                        )
                );
                return [...withoutSource, newShift];
            }
        });
    };

    const handleCellDragOver = (user, dateStr) => (e) => {
        e.preventDefault();
        const targetDate = toUTCDate(dateStr);

        const hasLeaveOnTargetDay = leaves.some(
            (l) =>
                l.user === user &&
                targetDate >= new Date(Date.UTC(l.startDate.getUTCFullYear(), l.startDate.getUTCMonth(), l.startDate.getUTCDate())) &&
                targetDate <= new Date(Date.UTC(l.endDate.getUTCFullYear(), l.endDate.getUTCMonth(), l.endDate.getUTCDate()))
        );

        if (hasLeaveOnTargetDay) {
            e.dataTransfer.dropEffect = 'none';
        } else {
            e.dataTransfer.dropEffect = (e.ctrlKey || e.metaKey) ? 'copy' : 'move';
        }
    };

    return (
        <div className={'seethrough'} style={{ padding: 16, width: '100%', height: '100%',
            overflow: 'hidden', borderRadius: 'var(--def-border-radius)' }}>
            <h2 style={{ margin: 0 }}>Weekly Test Schedule</h2>
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
                    <thead>
                    <tr>
                        <th
                            style={{
                                textAlign: 'left',
                                padding: '8px 12px',
                                borderBottom: '2px solid #e5e7eb',
                                width: 160,
                            }}
                        >
                            User
                        </th>
                        {dates.map((dateStr) => {
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const dayIdx = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
                            const shortDay = dayNames[dayIdx];

                            return (
                                <th
                                    key={dateStr}
                                    style={{
                                        textAlign: 'center',
                                        padding: '8px 12px',
                                        borderBottom: '2px solid #e5e7eb',
                                    }}
                                >
                                    <div>{dateStr}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-color-3)', marginBottom: 2 }}>{shortDay}</div>
                                </th>
                            );
                        })}

                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td
                                style={{
                                    padding: '10px 12px',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontWeight: 600,
                                }}
                            >
                                {u.first_name} {u.last_name}
                            </td>
                            {dates.map((dateStr, di) => {
                                const d = toUTCDate(dateStr);

                                const shift = shifts.filter(s =>
                                    s.user.id === u.id && sameDay(new Date(s.start_time), d)
                                );

                                const leave = leaves.find(l =>
                                    l.user === u.id && d >= l.startDate && d <= l.endDate
                                );

                                const isLeaveStart = leave ? sameDay(d, leave.startDate) : false;

                                if (leave && !isLeaveStart) {
                                    return null;
                                }

                                let totalDays;
                                let colSpan = 1;
                                if (isLeaveStart) {
                                    const dayDiff = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));
                                    totalDays = dayDiff(
                                        new Date(Date.UTC(leave.startDate.getUTCFullYear(), leave.startDate.getUTCMonth(), leave.startDate.getUTCDate())),
                                        new Date(Date.UTC(leave.endDate.getUTCFullYear(), leave.endDate.getUTCMonth(), leave.endDate.getUTCDate()))
                                    ) + 1;

                                    const remainingColumns = dates.length - di;
                                    colSpan = Math.max(1, Math.min(totalDays, remainingColumns));
                                }

                                const key = `${u}-${dateStr}`;

                                const cellStyle = {
                                    padding: '10px 12px',
                                    borderBottom: '1px solid #f3f4f6',
                                    textAlign: 'center',
                                };

                                return (
                                    <td
                                        key={key}
                                        style={cellStyle}
                                        colSpan={colSpan}
                                        onDragOver={handleCellDragOver(u.id, dateStr)}
                                        onDrop={handleCellDrop(u.id, dateStr)}
                                    >
                                        {shift.length > 0 ?
                                            shift.map((s, si) => <Shift
                                                key={si}
                                                time={`${new Date(s.start_time).toLocaleTimeString('pl-PL', {hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })} - ${new Date(s.end_time).toLocaleTimeString('pl-PL', {hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })}`}
                                                role={s.job_post.name}
                                                draggableProps={makeShiftDragHandlers(s)}
                                            />)
                                        : isLeaveStart ? (
                                            <Leave days={totalDays} type={leave.type} />
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Test;