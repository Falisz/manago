// FRONTEND/components/ScheduleDrafts/Item.jsx
import React, {useCallback, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import useAppState from '../../contexts/AppStateContext';
import {useModals} from '../../contexts/ModalContext';
import Button from '../Button';
import {formatDate} from '../../utils/dates';

const ScheduleDraftItem = ({schedule, deleteDraft}) => {
    const { openModal, closeTopModal } = useModals();
    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();

    const start_date = useMemo(() => new Date(schedule.start_date), [schedule.start_date]);
    const end_date = useMemo(() => new Date(schedule.end_date), [schedule.end_date]);

    const editSchedule = useCallback(() => {
        setScheduleEditor({
            ...schedule,
            type: 'draft'
        });
        navigate('/planner/editor');
        closeTopModal();
    }, [setScheduleEditor, closeTopModal, navigate, schedule]);

    return (
        <div className={'schedule-draft-item'}>
            <div className={'schedule-draft-item-header'}>
                <h2>{schedule.name}</h2>
                <Button
                    icon={'preview'}
                    title={'Preview'}
                    transparent={true}
                />
                <Button
                    icon={'edit'}
                    title={'Edit'}
                    transparent={true}
                    onClick={() => openModal({content: 'scheduleDraftEdit', contentId: schedule.id, type: 'dialog'})}
                />
                <Button
                    icon={'schedule'}
                    title={'Plan'}
                    transparent={true}
                    onClick={editSchedule}
                />
                <Button
                    icon={'delete'}
                    title={'Delete'}
                    transparent={true}
                    onClick={deleteDraft}
                />
            </div>
            <div className={'schedule-draft-item-description'}>
                Date range: {formatDate(start_date)} - {formatDate(end_date)}<br/>
                Shifts: {(schedule.shifts && schedule.shifts.length) || 0}<br/>
                Users: {schedule.users_count || 0}<br/>
                Note: {schedule.description}
            </div>
        </div>
    );
};

export default ScheduleDraftItem;