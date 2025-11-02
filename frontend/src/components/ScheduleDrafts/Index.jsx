// FRONTEND/components/ScheduleDrafts/Index.jsx
import React, {useEffect, useCallback} from 'react';
import {useModals} from '../../contexts/ModalContext';
import Button from '../Button';
import useSchedules from '../../hooks/useSchedules';
import ScheduleDraftItem from './Item';

const ScheduleDraftsIndex = () => {
    const { openModal, refreshTriggers, refreshData, closeTopModal } = useModals();
    const { scheduleDrafts, fetchScheduleDrafts, discardScheduleDraft  } = useSchedules();

    useEffect(() => {
        const refresh = refreshTriggers?.scheduleDrafts || false;
        
        if (refresh)
            delete refreshTriggers.scheduleDrafts;
        
        if (!scheduleDrafts || refresh)
            fetchScheduleDrafts().then();
    }, [refreshTriggers.scheduleDrafts, scheduleDrafts, fetchScheduleDrafts]);

    const handleDraftDelete = useCallback((id) => {
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

    return (<>
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
                <ScheduleDraftItem 
                    key={idx}
                    schedule={schedule} 
                    deleteDraft={() => handleDraftDelete(schedule.id)}
                />
            )
        }
    </>);
};

export default ScheduleDraftsIndex;