// FRONTEND/components/Schedules/UserShiftTable.jsx
import React, {useCallback, useRef, useState} from 'react';
import {Item, Menu, useContextMenu} from 'react-contexify'
import useNav from '../../contexts/NavContext';
import Icon from '../Icon';
import ComboBox from '../ComboBox';
import {generateDateList, formatDate, sameDay} from '../../utils/dates';
import '../../styles/UserSchedule.css';
import InWorks from "../InWorks";


const LeaveItem = ({ days, type, color }) => (
    <div className={'leave-item'} style={{background: color+'90'}}>
        <span>{days || 1}-day{days > 1 ? 's' : ''} Leave</span>
        <span className={'subtitle'}>{type}</span>
    </div>
);

const ShiftItem = ({ shift, editMode, onDragStart, onDragEnd, onContextMenu, onClick,
                       selectShift, updateShift, jobPosts }) => {

    const { openDialog } = useNav();

    if (!shift)
        return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newData = {};

        if (name === 'start_time' || name === 'end_time') {
            newData = {
                [name]: value
            }
        }

        if (name === 'job_post') {
            newData = {
                job_post: jobPosts.find(jobPost => jobPost.id === parseInt(value))
            }
        }

        updateShift({ shift: {...shift, ...newData}});
    }

    return <div
        className={'shift-item' + (shift.selected ? ' selected' : '') + (!editMode ? ' app-clickable' : '')}
        style={{background: (shift.job_post ? shift.job_post.color+'90' : 'var(--seethrough-background)'), position: 'relative'}}
        draggable={editMode}
        onDragStart={editMode ? (e) => onDragStart(e, shift) : undefined}
        onDragEnd={editMode ? (e) => onDragEnd(e, shift) : undefined}
        onContextMenu={editMode ? (e) => onContextMenu(e, shift) : undefined}
        onClick={editMode ? (e) => onClick(e, shift) : () => openDialog({content: 'shiftDetails', contentId: shift.id})}
    >
        <span className={'time-range'}>{editMode ?
            <><input
                value={shift.start_time.slice(0, 5)}
                name={'start_time'}
                type={'time'}
                step={300}
                onChange={handleChange}
                /> - <input
                value={shift.end_time.slice(0, 5)}
                name={'end_time'}
                type={'time'}
                step={300}
                onChange={handleChange}
            /></>
         :`${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`}</span>
        {<span className={'subtitle'}>{editMode ?
            <ComboBox
                name={'job_post'}
                value={shift.job_post?.id || null}
                options={jobPosts ? jobPosts.map(jobPost => ({id: jobPost.id, name: jobPost.name})): [{id: null, name: 'None'}]}
                onChange={handleChange}
                searchable={false}
                style={{padding: 0, background: 'none'}}
                selectedStyle={{padding: 0, background: 'none'}}
                selectedTextStyle={{padding: 0, color: 'white', fontSize: '.8rem', fontWeight: '600'}}
            /> :
            shift.job_post && shift.job_post.name
        }
        </span>}
        {editMode &&
            <Icon
                i={shift.selected ? 'check_circle' : 'circle'}
                s={true}
                style={{fontSize: '.7rem', position: 'absolute', right: '5px', bottom: '5px'}}
                onClick={selectShift}
            />
        }
    </div>
};

const UserSchedule = ({schedule, updateUserShift, jobPosts, editable=false}) => {
    const { openModal, setUnsavedChanges } = useNav();

    const MENU_ID = 'schedule_context_menu';
    const { show } = useContextMenu({ id: MENU_ID, });

    const [ selectedCells, setSelectedCells ] = useState(new Set());

    const displayContextMenu = (e, item) => {
        if (!editable) return;
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

    const handleCellSelection = useCallback((e) => {
        const data = e.target['dataset'];
        const cell = `${data.user}-${data.date}`;
        if (selectedCells.has(cell)) {
            setSelectedCells(prev => {
                const newSelectedCells = new Set(prev);
                newSelectedCells.delete(cell);
                return newSelectedCells;
            })
        } else {
            setSelectedCells(prev => {
                const newSelectedCells = new Set(prev);
                newSelectedCells.add(cell);
                return newSelectedCells;
            })
        }
    }, [selectedCells, setSelectedCells]);

    const handleShiftUpdate = useCallback(({shift}) => {
        setUnsavedChanges(true);
        updateUserShift({ shift, action: 'update' });
    }, [setUnsavedChanges, updateUserShift]);

    const handleShiftAdd = ({user, date, shift}) => {
        if (!editable || !user || !date)
            return;

        user = parseInt(user);

        if (!shift)
            shift = {
                id: `new${Math.floor(Math.random() * 1001)}`,
                user,
                date,
                start_time: '09:00',
                end_time: '17:00',
                job_location: null,
                job_post: null,
            };

        setUnsavedChanges(true);
        updateUserShift({ shift, action: 'add' });
    };

    const handleShiftSelection = (shift) => {
        updateUserShift({ shift: {...shift, selected: !shift.selected}, action: 'update' });
    };

    const handleMouseEnter = (e) => {
        if (editable)
            return;

        const selector = getSelector(e);

        if (selector)
            document
                .querySelectorAll(selector)
                .forEach(cell => cell.classList.add('column-highlight'));

    };

    const handleMouseLeave = (e) => {
        if (editable)
            return;
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
        if (selector)
            document
                .querySelectorAll(selector)
                .forEach(cell => cell.classList.remove('column-highlight'));
    };

    const dragPreviewRef = useRef(null);

    const hasLeaveOnTarget = (leaves, targetDate) => leaves?.some(
            (l) => {
                l.start_date = new Date(l.start_date);
                l.end_date = new Date(l.end_date);

                return targetDate >= new Date(Date.UTC(l.start_date.getUTCFullYear(), l.start_date.getUTCMonth(), l.start_date.getUTCDate())) &&
                    targetDate <= new Date(Date.UTC(l.end_date.getUTCFullYear(), l.end_date.getUTCMonth(), l.end_date.getUTCDate()))
            }
        );

    const handleShiftClick = (e, shift) => {
        if (!editable)
            return;

        if (e.shiftKey) {
            handleShiftSelection(shift)
            e.preventDefault();
        }
    }

    const handleShiftDragStart = (e, shift) => {
        if (!editable)
            return;

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
    };

    const handleShiftDragEnd = () => {
        dragPreviewRef.current.remove();
        dragPreviewRef.current = null;
    };

    const handleCellDrop = (user, date) => (e) => {
        if (!editable) return;
        e.preventDefault();

        const targetUser = schedule.users.get(user);
        const leaves = targetUser ? targetUser['leaves'] : [];
        const hasLeaveOnTargetDay = hasLeaveOnTarget(leaves, new Date(date));

        if (hasLeaveOnTargetDay)
            return;

        const data = e.dataTransfer.getData('application/json');

        if (!data)
            return;

        try {
            const sourceShift = JSON.parse(data);
            const newShift = JSON.parse(data);

            const isCopy = !!(e.ctrlKey || e.metaKey);
            const isSameUser = sourceShift.user === user;
            const isSameDay = sourceShift.date === date;
            const isSameCell = isSameUser && isSameDay;

            if (isSameCell && !isCopy)
                return;

            newShift.date = date;
            newShift.user = user;

            if (isCopy)
                newShift.id = `new${Math.floor(Math.random() * 1001)}`;

            setUnsavedChanges(true);
            updateUserShift({ shift: newShift, sourceShift, action: isCopy ? 'copy' : 'move' });

        } catch {}

    };

    const handleCellDragOver = (user, date) => (e) => {
        if (!editable)
            return;

        e.preventDefault();
        const targetUser = schedule.users.get(user);
        const leaves = targetUser ? targetUser.leaves : [];

        const hasLeaveOnTargetDay = hasLeaveOnTarget(leaves, new Date(date));

        if (hasLeaveOnTargetDay) {
            e.dataTransfer.dropEffect = 'none';
        } else {
            e.dataTransfer.dropEffect = (e.ctrlKey || e.metaKey) ? 'copy' : 'move';
        }
    };

    const handleShiftDelete = (shift) => {
        if (!editable)
            return;
        setUnsavedChanges(true);
        updateUserShift({ shift, action: 'delete' });
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
    if (!schedule.start_date || !schedule.end_date)
        return <InWorks
            icon={'calendar_clock'}
            description={`Cannot display Schedule ${editable ? 'Editor' : 'View'}. There is no time range specified.`}
            hideReturnLink={true}
        />;
        
    const dates = generateDateList(schedule.start_date, schedule.end_date);

    return <div className={'app-schedule-content app-scroll'}>
        <table className={'app-schedule-table' + (editable ? ' editable' : '')}>
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
            {schedule.placeholder && <tr>
                <td colSpan={3} style={{fontStyle: 'italic', textAlign: 'center'}}>{schedule.placeholder}</td>
            </tr>}
            {schedule.users && schedule.users.values && [...schedule.users.values()].map((user) =>
                <tr key={user.id}>
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
                        const dateStr = formatDate(date);

                        const leave = user.leaves?.find((l) => date >= new Date(l.start_date) && date <= new Date(l.end_date));

                        const isLeaveStart = leave ? sameDay(date, new Date(leave.start_date)) : false;

                        if (leave && !isLeaveStart)
                            return null;

                        const shifts = user.shifts?.get(dateStr) || [];

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

                        const key = `${user.id}-${dateStr}`;

                        const selected = selectedCells.has(key);

                        return (
                            <td
                                key={key}
                                className={(selected ? 'selected' : '')}
                                data-user={user.id}
                                data-date={dateStr}
                                colSpan={colSpan}
                                onClick={handleCellSelection}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onDoubleClick={(e) =>
                                    handleShiftAdd({user: e.target['dataset'].user, date: e.target['dataset'].date})}
                                onDragOver={editable ? handleCellDragOver(user.id, dateStr) : null}
                                onDrop={editable ? handleCellDrop(user.id, dateStr) : null}
                            >
                                {isLeaveStart ?
                                    <LeaveItem
                                        days={leave.days}
                                        type={leave.type}
                                        color={leave.color}
                                    /> : shifts.length > 0 ? shifts.map((shift, index) =>
                                        <ShiftItem
                                            key={index}
                                            shift={shift}
                                            editMode={editable}
                                            jobPosts={jobPosts}
                                            onDragStart={handleShiftDragStart}
                                            onDragEnd={handleShiftDragEnd}
                                            onContextMenu={displayContextMenu}
                                            onClick={handleShiftClick}
                                            updateShift={handleShiftUpdate}
                                            selectShift={() => handleShiftSelection(shift)}
                                            deleteShift={() => handleShiftDelete(shift)}
                                        /> ) : null
                                }
                            </td>
                        );
                    })}
                </tr>
            )}
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
export default UserSchedule;