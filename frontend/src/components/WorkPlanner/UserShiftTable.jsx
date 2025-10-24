// FRONTEND/components/WorkPlanner/UserShiftTable.jsx
import React, {useRef, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import Loader from '../Loader';
import { formatDate, formatTime, sameDay, toUTCDate } from '../../utils/dates';
import LeaveItem from './LeaveItem';
import ShiftItem from './ShiftItem';

const UserShiftTable = ({dates, users, setUsers, placeholder, loading, editable}) => {
    const { openModal } = useModals();

    const getSelector = (e) => {
        const user = e.currentTarget.getAttribute('data-user');
        const date = e.currentTarget.getAttribute('data-date');

        if (user && date)
            return `td[data-user='${user}'], td[data-date='${date}'], th[data-user='${user}'], th[data-date='${date}']`;

        else if (user)
            return `td[data-user='${user}'], th[data-user='${user}']`;

        else if (date)
            return `td[data-date='${date}'], th[data-date='${date}']`;

        else return null;
    }

    const handleMouseEnter = (e) => {
        const selector = getSelector(e);

        if (selector) {
            document.querySelectorAll(selector)
                .forEach(cell => cell.classList.add('column-highlight'));
        }
    };

    const handleMouseLeave = (e) => {
        const user = e.currentTarget.getAttribute('data-user');
        const date = e.currentTarget.getAttribute('data-date');
        let selector = '';
        if (user && date) {
            selector = `td[data-user='${user}'], td[data-date='${date}'], th[data-user='${user}'], th[data-date='${date}']`;
        } else if (user) {
            selector = `td[data-user='${user}'], th[data-user='${user}']`;
        } else if (date) {
            selector = `td[data-date='${date}'], th[data-date='${date}']`;
        }
        if (selector) {
            document.querySelectorAll(selector)
                .forEach(cell => cell.classList.remove('column-highlight'));
        }
    };

    const dragPreviewRef = useRef(null);

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
                sourceDate: new Date(shift.start_time).toISOString(),
            });
            e.dataTransfer.setData('application/json', payload);

            const target = e.currentTarget;
            const clone = target.cloneNode(true);
            clone.style.pointerEvents = 'none';
            clone.style.position = 'fixed';
            clone.style.top = '-1000px';
            clone.style.right = '-1000px';
            document.querySelector('.app-schedule-table').appendChild(clone);
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

        // TODO: updating whole user-shift map of id: user with shifts that they have.
        setUsers((prev) => {
            const targetUser = users.find(u => u.id === user);
            const leaves = targetUser ? targetUser['leaves'] : [];

            const hasLeaveOnTargetDay = leaves.some(
                (l) =>
                    targetDate >= new Date(l.start_date) &&
                    targetDate <= new Date(l.end_date)
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
        const targetUser = users.find(u => u.id === user);
        const leaves = targetUser ? targetUser['leaves'] : [];

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
                            data-date={formattedDate}
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
            {shifts?.map((user) => {
                return <tr key={user.id}>
                    <td
                        className={'user-cell'}
                        data-user={user.id}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
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

                        const leave = user.leaves?.find((l) => date >= new Date(l.start_date) && date <= new Date(l.end_date));

                        const isLeaveStart = leave ? sameDay(date, new Date(leave.start_date)) : false;

                        if (leave && !isLeaveStart)
                            return null;

                        const shift = user.shifts?.filter((s) => sameDay(new Date(s.start_time), date)) || [];

                        let totalDays;

                        let colSpan = 1;

                        if (isLeaveStart) {
                            const dayDiff = (a, b) =>
                                Math.round((b.setHours(0,0,0,0) - a.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));

                            const startDate = new Date(leave.start_date);
                            const endDate = new Date(leave.end_date);

                            totalDays = dayDiff(startDate, endDate) + 1;

                            const remainingColumns = dates.length - dateIndex;

                            colSpan = Math.max(1, Math.min(totalDays, remainingColumns));
                        }

                        const key = `${user.id}-${formattedDate}`;

                        return (
                            <td
                                key={key}
                                data-user={user.id}
                                data-date={formattedDate}
                                colSpan={colSpan}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onDragOver={editable ? handleCellDragOver(user.id, formattedDate) : null}
                                onDrop={editable ? handleCellDrop(user.id, formattedDate) : null}
                            >
                                {isLeaveStart ? <LeaveItem days={leave.days} type={leave.type} color={leave.color} /> :
                                    shift.length > 0 ?
                                        shift.map((s, si) => <ShiftItem
                                            key={si}
                                            time={`${formatTime(s.start_time)} - ${formatTime(s.end_time)}`}
                                            role={s.job_post.name}
                                            color={s.job_post.color}
                                            draggableProps={editable ? makeShiftDragHandlers(s) : []}
                                        /> ) : null }
                            </td>
                        );
                    })}
                </tr>;
            })}
            </tbody>
        </table>
    </div>
}
export default UserShiftTable;