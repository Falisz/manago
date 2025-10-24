// FRONTEND/components/WorkPlanner/UserShiftTable.jsx
import React, {useRef} from 'react';
import { useModals } from '../../contexts/ModalContext';
import Loader from '../Loader';
import { formatDate, formatTime, sameDay } from '../../utils/dates';
import LeaveItem from './LeaveItem';
import ShiftItem from './ShiftItem';
import {Item, Menu, useContextMenu} from 'react-contexify';

const UserShiftTable = ({dates, users, setUsers, placeholder, loading, editable}) => {
    const { openModal } = useModals();

    const MENU_ID = 'schedule_context_menu';
    const { show } = useContextMenu({ id: MENU_ID, });

    const displayContextMenu = (e, item) => {
        e.preventDefault();
        show({ event: e, props: item });
    }

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

    const hasLeaveOnTarget = (leaves, targetDate) => leaves.some(
            (l) => {
                l.start_date = new Date(l.start_date);
                l.end_date = new Date(l.end_date);

                return targetDate >= new Date(Date.UTC(l.start_date.getUTCFullYear(), l.start_date.getUTCMonth(), l.start_date.getUTCDate())) &&
                    targetDate <= new Date(Date.UTC(l.end_date.getUTCFullYear(), l.end_date.getUTCMonth(), l.end_date.getUTCDate()))
            }
        );

    const makeShiftDragHandlers = (shift) => ({
        draggable: true,
        onDragStart: (e) => {
            e.dataTransfer.effectAllowed = 'copyMove';
            const payload = JSON.stringify(shift);
            e.dataTransfer.setData('application/json', payload);

            const width = e.currentTarget.getBoundingClientRect().width;

            const target = e.currentTarget;
            const clone = target.cloneNode(true);
            clone.style.pointerEvents = 'none';
            clone.style.position = 'fixed';
            clone.style.width = `${width}px`;
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

    const handleCellDrop = (user, date) => (e) => {
        e.preventDefault();

        const targetUser = users.get(user);
        const targetDate = new Date(date);
        const leaves = targetUser ? targetUser['leaves'] : [];

        const hasLeaveOnTargetDay = hasLeaveOnTarget(leaves, new Date(date));

        if (hasLeaveOnTargetDay)
            return;

        const isCopy = !!(e.ctrlKey || e.metaKey);

        const data = e.dataTransfer.getData('application/json');

        if (!data)
            return;

        let sourceShift;
        let newShift;

        try {

            sourceShift = JSON.parse(data);
            newShift = JSON.parse(data);

            newShift.user = user;

            const startTime = new Date(sourceShift.start_time);

            const sameCell = sameDay(new Date(sourceShift.start_time), targetDate) && sourceShift.user === user;

            if (sameCell)
                return;

            const endTime = new Date(sourceShift.end_time);

            const isSameDay = sameDay(startTime, endTime);

            startTime.setFullYear(targetDate.getFullYear());
            startTime.setMonth(targetDate.getMonth());
            startTime.setDate(targetDate.getDate());

            if (isSameDay) {
                endTime.setFullYear(targetDate.getFullYear());
                endTime.setMonth(targetDate.getMonth());
                endTime.setDate(targetDate.getDate());
            } else {
                const nextDay = new Date(targetDate);
                nextDay.setDate(targetDate.getDate() + 1);
                endTime.setFullYear(nextDay.getFullYear());
                endTime.setMonth(nextDay.getMonth());
                endTime.setDate(nextDay.getDate());
            }

            newShift.start_time = startTime.toISOString();
            newShift.end_time = endTime.toISOString();

            if (isCopy)
                newShift.id = `new${Math.floor(Math.random() * 1001)}`;

        } catch {
            return;
        }

        setUsers((prev) => {

            if (isCopy) {
                const newUsers = new Map(prev);

                const targetUser = newUsers.get(user);
                const updatedTargetUser = { ...targetUser, shifts: [...targetUser.shifts, newShift] };

                newUsers.set(user, updatedTargetUser);

                return newUsers;

            } else {
                const newUsers = new Map(prev);

                const targetUser = newUsers.get(user);

                if (sourceShift.user === user) {
                    const updatedTargetUser = {
                        ...targetUser,
                        shifts: [...targetUser.shifts.filter((s) => s.id !== sourceShift.id), newShift] };

                    newUsers.set(user, updatedTargetUser);

                } else {
                    const updatedTargetUser = {
                        ...targetUser,
                        shifts: [...targetUser.shifts, newShift] };

                    newUsers.set(user, updatedTargetUser);

                    const sourceUser = newUsers.get(sourceShift.user);

                    const updatedSourceUser = {
                        ...sourceUser,
                        shifts: sourceUser.shifts.filter((s) => s.id !== sourceShift.id)
                    };

                    newUsers.set(sourceShift.user, updatedSourceUser);
                }

                return newUsers;
            }
        });
    };

    const handleCellDragOver = (user, date) => (e) => {
        e.preventDefault();
        const targetUser = users.get(user);
        const leaves = targetUser ? targetUser.leaves : [];

        const hasLeaveOnTargetDay = hasLeaveOnTarget(leaves, new Date(date));


        if (hasLeaveOnTargetDay) {
            e.dataTransfer.dropEffect = 'none';
        } else {
            e.dataTransfer.dropEffect = (e.ctrlKey || e.metaKey) ? 'copy' : 'move';
        }
    };

    const handleShiftDelete = (shift) => {

        const userID = shift.user;

        setUsers((prev) => {
            const newUsers = new Map(prev);
            const user = newUsers.get(userID);

            newUsers.set(userID, {
                ...user,
                shifts: user.shifts.filter((s) => s.id !== shift.id)
            });

            return newUsers;
        });

        console.log(shift);
    }

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
            {users && [...users.values()].map((user) => {
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
                                onDragOver={editable ? handleCellDragOver(user.id, date) : null}
                                onDrop={editable ? handleCellDrop(user.id, date) : null}
                            >
                                {isLeaveStart ? <LeaveItem days={leave.days} type={leave.type} color={leave.color} /> :
                                    shift.length > 0 ?
                                        shift.map((s, si) => <ShiftItem
                                            key={si}
                                            time={`${formatTime(s.start_time)} - ${formatTime(s.end_time)}`}
                                            role={s.job_post.name}
                                            color={s.job_post.color}
                                            draggableProps={editable ? makeShiftDragHandlers(s) : []}
                                            onContextMenu={(e) => displayContextMenu(e, s)}
                                        /> ) : null }
                            </td>
                        );
                    })}
                </tr>;
            })}
            </tbody>
        </table>
        <Menu className={'app-context-menu'} id={MENU_ID}>
            <Item
                key={2}
                onClick={({props}) => handleShiftDelete(props)}
            >
                Delete Shift
            </Item>
        </Menu>
    </div>
}
export default UserShiftTable;