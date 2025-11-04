// FRONTEND/components/Schedules/MonthlySchedule.jsx
import React from 'react';
import InWorks from '../InWorks';

const MonthlySchedule = ({schedule}) => {

    console.log('Provided schedule: ', schedule);

    return <InWorks
        icon={'calendar_month'}
        title={'Monthly Schedule'}
        description={'Monthly calendar will be here. Similarly with below, it allows to set up date and select branch/weekend.'}
    />;
};

export default MonthlySchedule;