// FRONTEND/components/WorkPlanner/ShiftItem.jsx
import React from 'react';
import {formatTime} from "../../utils/dates";
import Icon from "../Icon";

const ShiftItem = ({ shift, editable, onDragStart, onDragEnd, onContextMenu, onClick, onDoubleClick,
                       selectShift, deleteShift }) => {

    if (!shift) return null;

    return <div
        className={'shift-item' + (shift.selected ? ' selected' : '')}
        style={{background: shift.job_post.color+'90', position: 'relative'}}
        draggable={editable}
        onDragStart={editable ? (e) => onDragStart(e, shift) : undefined}
        onDragEnd={editable ? (e) => onDragEnd(e, shift) : undefined}
        onContextMenu={editable ? (e) => onContextMenu(e, shift) : undefined}
        onClick={editable ? (e) => onClick(e, shift) : undefined}
        onDoubleClick={editable ? (e) => onDoubleClick(e, shift) : undefined}
    >
        <span>{`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}</span>
        <span className={'subtitle'}>{shift.job_post.name}</span>
        {editable &&
            <Icon
                i={shift.selected ? 'check_circle' : 'circle'}
                s={true}
                style={{fontSize: '.7rem', position: 'absolute', right: '5px', bottom: '5px'}}
                onClick={selectShift}
            />
        }
        {editable &&
            <Icon i={'edit'} s={true} style={{fontSize: '.7rem', position: 'absolute', left: '5px', top: '5px'}}/>
        }
        {editable &&
            <Icon
                i={'close'}
                s={true}
                style={{fontSize: '.7rem', position: 'absolute', right: '5px', top: '5px'}}
                onClick={deleteShift}
            />
        }
    </div>
};

export default ShiftItem;