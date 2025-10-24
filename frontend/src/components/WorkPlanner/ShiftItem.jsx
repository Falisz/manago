// FRONTEND/components/WorkPlanner/ShiftItem.jsx
import React from 'react';

const ShiftItem = ({ time, role, color, draggableProps }) => (
    <div
        {...draggableProps} className={'shift-item'} style={{background: color+'90'}} >
        <span>{time}</span>
        <span className={'subtitle'}>{role}</span>
    </div>
);

export default ShiftItem;