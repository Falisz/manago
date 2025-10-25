// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React from 'react';
import WorkingSchedulesIndex from './WorkingSchedulesIndex';
import '../../styles/WorkPlanner.css';

const WorkPlanner = () => {

    return (
        <div className={'work-planner app-scroll'}>
            <div className={'planner-widget'}>
                <h1>Your Schedule</h1>
                <p>Here you can view and edit your schedule.</p>
            </div>
            <div className={'planner-widget'}>
                <h1>Your Teams Schedule</h1>
                <p>Here you can view and edit your teams schedule.</p>
            </div>
            <div className={'planner-widget'}>
                <WorkingSchedulesIndex/>
            </div>
            <div className={'planner-widget'}>
                <h1>Pending Leave approvals</h1>
                <p>Oncoming leaves to approve or reject...</p>
            </div>
        </div>
    );
};

export default WorkPlanner;