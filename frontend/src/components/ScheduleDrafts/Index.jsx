// FRONTEND/components/ScheduleDrafts/Index.jsx
import React, {useEffect, useCallback} from 'react';
import {useModals} from '../../contexts/ModalContext';
import Button from '../Button';
import useSchedules from '../../hooks/useSchedules';
import {useNavigate} from "react-router-dom";
import useAppState from "../../contexts/AppStateContext";

const ScheduleDraftsIndex = () => {
    const { openModal, refreshTriggers, refreshData, closeTopModal } = useModals();
    const { scheduleDrafts, fetchScheduleDrafts, discardScheduleDraft  } = useSchedules();
    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();

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

    const editSchedule = useCallback((schedule) => {
        openModal({
            content: 'scheduleDraftEdit',
            contentId: schedule.id,
            style: {overflow: 'unset'},
            type: 'dialog'
        })
    }, []);

    const editScheduleShifts = useCallback((schedule) => {
        setScheduleEditor({
            ...schedule,
            type: 'draft'
        });
        navigate(`/schedules/edit/${schedule.id}`);
        closeTopModal();
    }, [setScheduleEditor, closeTopModal, navigate]);

    const previewSchedule = useCallback((id) => {
        navigate(`/schedules/view/${id}`);
    }, [navigate]);

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
                label={'Plan new schedule'}
                onClick={() => openModal({content: 'scheduleDraftNew', style: {overflow: 'unset'}, type: 'dialog'})}
            />
        </div>
        {scheduleDrafts && scheduleDrafts.length > 0 &&
            scheduleDrafts.map((schedule, idx) =>
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
                            icon={'schedule'}
                            title={'Plan'}
                            transparent={true}
                            onClick={() => editScheduleShifts(schedule)}
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
    </>;
};

export default ScheduleDraftsIndex;