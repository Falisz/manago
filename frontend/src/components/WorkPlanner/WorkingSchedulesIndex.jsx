// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React, {useCallback, useEffect, useMemo} from 'react';
import Button from "../Button";
import {useModals} from "../../contexts/ModalContext";
import useAppState from "../../contexts/AppStateContext";
import {useNavigate} from "react-router-dom";
import {formatDate} from "../../utils/dates";
import useScheduleDrafts from "../../hooks/useScheduleDrafts";

const ScheduleDraftItem = ({schedule}) => {

    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();
    const { closeTopModal } = useModals();

    const startDate = useMemo(() => new Date(schedule.start_date), [schedule]);
    const endDate = useMemo(() => new Date(schedule.end_date), [schedule]);

    const editSchedule = useCallback(() => {
        setScheduleEditor({
            type: 'working',
            name: schedule.name,
            schedule: schedule.id,
            fromDate: startDate,
            toDate: endDate
        });
        navigate('/planner/editor');
        closeTopModal();
    }, [setScheduleEditor, closeTopModal, navigate, schedule, startDate, endDate]);

    return (
        <div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h2 style={{marginRight: 'auto'}}>{schedule.name} ({formatDate(startDate)} - {formatDate(endDate)})</h2>
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
            <p>{schedule.description}</p>
        </div>
    );
}

const WorkingScheduleIndex = () => {

    const { scheduleDrafts, fetchScheduleDrafts  } = useScheduleDrafts();
    const { openModal } = useModals();

    useEffect(() => {
        fetchScheduleDrafts().then();
    }, [fetchScheduleDrafts]);

    return (
        <div>
            <h1>Schedule Drafts</h1>
            <Button
                icon={'add'}
                label={'Plan new schedule'}
                onClick={() => openModal({content: 'newSchedule', type: 'dialog'})}
            />
            {scheduleDrafts && scheduleDrafts.length > 0 &&
                scheduleDrafts.map((schedule, idx) => <ScheduleDraftItem key={idx} schedule={schedule}/>)
            }
        </div>
    );
};

export default WorkingScheduleIndex;