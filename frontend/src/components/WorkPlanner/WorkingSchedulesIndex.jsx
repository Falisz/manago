// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React, {useCallback, useEffect, useMemo} from 'react';
import useSchedule from "../../hooks/useSchedule";
import Button from "../Button";
import {useModals} from "../../contexts/ModalContext";
import useAppState from "../../contexts/AppStateContext";
import {useNavigate} from "react-router-dom";
import {formatDate} from "../../utils/dates";

const WorkingScheduleItem = ({workingSchedule}) => {

    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();
    const { closeTopModal } = useModals();

    const startDate = useMemo(() => new Date(workingSchedule.start_date), [workingSchedule]);
    const endDate = useMemo(() => new Date(workingSchedule.end_date), [workingSchedule]);

    const editSchedule = useCallback(() => {
        setScheduleEditor({
            type: 'working',
            name: workingSchedule.name,
            schedule: workingSchedule.id,
            fromDate: startDate,
            toDate: endDate
        });
        navigate('/planner/editor');
        closeTopModal();
    }, [setScheduleEditor, closeTopModal, navigate, workingSchedule, startDate, endDate]);

    return (
        <div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h2 style={{marginRight: 'auto'}}>{workingSchedule.name} ({formatDate(startDate)} - {formatDate(endDate)})</h2>
                <Button
                    icon={'preview'}
                    title={'Preview'}
                    transparent={true}
                    iconStyle={{fontSize: '2rem'}}
                />
                <Button
                    icon={'edit'}
                    title={'Edit'}
                    transparent={true}
                    iconStyle={{fontSize: '2rem'}}
                    onClick={editSchedule}
                />
                <Button
                    icon={'delete'}
                    title={'Delete'}
                    transparent={true}
                    iconStyle={{fontSize: '2rem'}}
                />
            </div>
            <p>{workingSchedule.description}</p>
        </div>
    );
}

const WorkingScheduleIndex = () => {

    const { fetchWorkingSchedules, workingSchedules } = useSchedule();
    const { openModal } = useModals();

    useEffect(() => {
        fetchWorkingSchedules().then();
    }, [fetchWorkingSchedules]);

    return (
        <div>
            <h1>Schedule Drafts</h1>
            <Button
                icon={'add'}
                label={'Plan new schedule'}
                onClick={() => openModal({content: 'newSchedule', type: 'dialog'})}
            />
            {workingSchedules && workingSchedules.length > 0 &&
                workingSchedules.map((workingSchedule, idx) => <WorkingScheduleItem key={idx} workingSchedule={workingSchedule}/>)
            }
        </div>
    );
};

export default WorkingScheduleIndex;