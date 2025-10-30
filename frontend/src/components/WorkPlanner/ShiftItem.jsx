// FRONTEND/components/WorkPlanner/ShiftItem.jsx
import React, {useState} from 'react';
import {formatTime} from "../../utils/dates";
import Icon from "../Icon";

const ShiftItem = ({ shift, editable, onDragStart, onDragEnd, onContextMenu, onClick,
                       selectShift, updateShift, deleteShift }) => {

    const [ editMode, setEditMode ] = useState();

    if (!shift)
        return null;

    const handleDoubleClick = (e) => {
        if (!editable)
            return;

        setEditMode(prev => !prev);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newData = {};

        if (name === 'start_time' || name === 'end_time') {
            const time = new Date(shift[name]);
            time.setHours(value.split(':')[0]);
            time.setMinutes(value.split(':')[1]);
            time.setSeconds(0);
            time.setMilliseconds(0);

            newData = {
                [name]: time
            }
        }

        updateShift({
            user: shift.user,
            shiftData: {
                ...shift,
                ...newData
            }
        })
    }

    return <div
        className={'shift-item' + (shift.selected ? ' selected' : '')}
        style={{background: (shift.job_post ? shift.job_post.color+'90' : 'var(--seethrough-background)'), position: 'relative'}}
        draggable={editable}
        onDragStart={editable ? (e) => onDragStart(e, shift) : undefined}
        onDragEnd={editable ? (e) => onDragEnd(e, shift) : undefined}
        onContextMenu={editable ? (e) => onContextMenu(e, shift) : undefined}
        onClick={editable ? (e) => onClick(e, shift) : undefined}
        onDoubleClick={handleDoubleClick}
    >
        <span className={'time-range'}>{editMode ?
            <><input
                value={formatTime(shift.start_time)}
                name={'start_time'}
                type={'time'}
                step={300}
                onChange={handleChange}
                /> - <input
                value={formatTime(shift.end_time)}
                name={'end_time'}
                type={'time'}
                step={300}
                onChange={handleChange}
            /></>
         :`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}</span>
        {shift.job_post && shift.job_post.name && <span className={'subtitle'}>{shift.job_post.name}</span>}
        {editable &&
            <Icon
                i={shift.selected ? 'check_circle' : 'circle'}
                s={true}
                style={{fontSize: '.7rem', position: 'absolute', right: '5px', bottom: '5px'}}
                onClick={selectShift}
            />
        }
    </div>
};

export default ShiftItem;