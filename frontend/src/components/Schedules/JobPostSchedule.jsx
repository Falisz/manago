// FRONTEND/components/Schedules/JobPostSchedule.jsx
import React from 'react';
import InWorks from '../InWorks';

const JobPostSchedule = ({schedule}) => {

    console.log('Provided schedule: ', schedule);

    return <InWorks
        icon={'view_list'}
        title={'Job Posts Schedule'}
        description={'Job Posts schedule will be here. This will be only available if job posts are enabled. It has only branch and project views for specific date-scopes.'}
    />;
};

export default JobPostSchedule;