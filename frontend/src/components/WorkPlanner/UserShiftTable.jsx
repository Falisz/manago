// FRONTEND/components/WorkPlanner/UserShiftTable.jsx
import React from 'react';
import { useModals } from '../../contexts/ModalContext';
import Loader from '../Loader';
import { formatDate, formatTime, sameDay } from '../../utils/dates';
import LeaveItem from './LeaveItem';
import ShiftItem from './ShiftItem';

const UserShiftTable = ({dates, users, placeholder, loading}) => {
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
            {users?.map((user) => {
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
                            >
                                {isLeaveStart ? <LeaveItem days={leave.days} type={leave.type} color={leave.color} /> :
                                    shift.length > 0 ?
                                        shift.map((s, si) => <ShiftItem
                                            key={si}
                                            time={`${formatTime(s.start_time)} - ${formatTime(s.end_time)}`}
                                            role={s.job_post.name}
                                            color={s.job_post.color}
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