// FRONTEND/components/WorkPlanner/LeaveItem.jsx
import React from 'react';

const LeaveItem = ({ days, type, color }) => (
    <div className={'leave-item'} style={{background: color+'90'}}>
        <span>{days || 1}-day{days > 1 ? 's' : ''} Leave</span>
        <span className={'subtitle'}>{type}</span>
    </div>
);

export default LeaveItem;