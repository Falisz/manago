// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React from 'react';
import WorkingSchedulesIndex from './WorkingSchedulesIndex';
import '../../styles/WorkPlanner.css';
import Button from '../Button';
import {useModals} from '../../contexts/ModalContext';

const WorkPlanner = () => {
    const { openModal } = useModals();

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
                <div className={'planner-widget-header'}>
                    <h1>Schedule Drafts</h1>
                    <Button
                        icon={'add'}
                        label={'Plan new schedule'}
                        onClick={() => openModal({content: 'newSchedule', type: 'dialog'})}
                    />
                </div>
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