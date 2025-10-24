// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React from 'react';
import WorkingSchedulesIndex from './WorkingSchedulesIndex';

const WorkPlanner = () => {

    return (
        <div>
            <h1>Your Schedule</h1>
            <p>Here you can view and edit your schedule.</p>
            <h1>Your Teams Schedule</h1>
            <p>Here you can view and edit your teams schedule.</p>
            <WorkingSchedulesIndex/>
        </div>
    );
};

export default WorkPlanner;