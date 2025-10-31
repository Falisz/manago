// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React from 'react';
import '../../styles/WorkPlanner.css';
import ScheduleDraftsIndex from '../ScheduleDrafts/Index';

const WorkPlanner = () => {

    return (
        <div className={'work-planner app-scroll'}>
            <div className={'planner-widget'}>
                <h1>Your Schedule</h1>
                <p>Here will be a brief next-7-day Schedule of your shifts.</p>
            </div>
            <div className={'planner-widget'}>
                <h1>Your Team</h1>
                <p>Here you can view brief schedule glance of dropdown chosen Team that you are part - next 3 days inc today.</p>
            </div>
            <div className={'planner-widget'}>
                <ScheduleDraftsIndex />
            </div>
            <div className={'planner-widget'}>
                <h1>Pending Leave approvals</h1>
                <p>Oncoming leaves to approve or reject...</p>
            </div>
        </div>
    );
};

export default WorkPlanner;