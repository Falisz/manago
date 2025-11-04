// FRONTEND/components/Schedules/Index.jsx
import React, {useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useModals} from '../../contexts/ModalContext';
import Button from '../Button';
import useSchedules from '../../hooks/useSchedules';
import useAppState from "../../contexts/AppStateContext";
import Loader from "../Loader";

const SchedulesIndex = () => {
    const { openModal, refreshTriggers, refreshData, closeTopModal } = useModals();
    const { scheduleDrafts, fetchScheduleDrafts, discardScheduleDraft, loading  } = useSchedules();
    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();

    const previewSchedule = useCallback((id) => {
        navigate(`/schedules/view/${id}`);
    }, [navigate]);

    const editSchedule = useCallback((schedule) => {
        if (schedule)  {
            setScheduleEditor({...schedule, mode: 'draft'});
            navigate('/schedules/edit' + (schedule.id ? ('/' + schedule.id) : ''));
        } else {
            setScheduleEditor({mode: 'new'});
            navigate('/schedules/new');
        }
    }, [setScheduleEditor, navigate]);

    const deleteSchedule = useCallback((id) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to discard this Schedule Draft? This action cannot be undone.',
            onConfirm: () => {
                discardScheduleDraft({scheduleId: id}).then();
                refreshData('scheduleDrafts', true);
                closeTopModal();
            },
        });
    }, [closeTopModal, discardScheduleDraft, openModal, refreshData]);

    useEffect(() => {
        const refresh = refreshTriggers?.scheduleDrafts || false;

        if (refresh)
            delete refreshTriggers.scheduleDrafts;

        if (!scheduleDrafts || refresh)
            fetchScheduleDrafts().then();
    }, [refreshTriggers.scheduleDrafts, scheduleDrafts, fetchScheduleDrafts]);

    return <>
        <div className={'header'}>
            <h1>Schedule Drafts</h1>
            <Button
                icon={'add'}
                label={'Plan new Schedule'}
                onClick={() => editSchedule()}
            />
        </div>
        <div className={'content app-scroll'}>
            { loading ? <Loader/> :
                scheduleDrafts && scheduleDrafts.length > 0 && scheduleDrafts.map((schedule, idx) =>
                    <div key={idx} className={'schedule-draft-item'}>
                        <div className={'schedule-draft-item-header'}>
                            <h2>{schedule.name}</h2>
                            <Button
                                icon={'preview'}
                                title={'Preview'}
                                transparent={true}
                                onClick={() => previewSchedule(schedule.id)}
                            />
                            <Button
                                icon={'edit'}
                                title={'Edit'}
                                transparent={true}
                                onClick={() => editSchedule(schedule)}
                            />
                            <Button
                                icon={'delete'}
                                title={'Delete'}
                                transparent={true}
                                onClick={() => deleteSchedule(schedule.id)}
                            />
                        </div>
                        <div className={'schedule-draft-item-description'}>
                            Date range: {schedule.start_date} - {schedule.end_date}<br/>
                            Shifts: {(schedule.shifts && schedule.shifts.length) || 0}<br/>
                            Users: {schedule.users_count || 0}<br/>
                            Note: {schedule.description}
                        </div>
                    </div>
                )
            }
        </div>
    </>;
};

export default SchedulesIndex;