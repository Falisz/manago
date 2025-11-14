// FRONTEND/components/Schedules/Index.jsx
import React, {useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import useApp from '../../contexts/AppContext';
import useSchedules from '../../hooks/useSchedules';
import Button from '../Button';
import Loader from '../Loader';
import '../../styles/Schedules.css';

const SchedulesIndex = () => {
    const { openModal, refreshTriggers, refreshData, closeTopModal } = useApp();
    const { scheduleDrafts, fetchScheduleDrafts, discardScheduleDraft, loading  } = useSchedules();
    const navigate = useNavigate();

    const previewSchedule = useCallback((id) => {
        navigate(`/schedules/view/${id}`);
    }, [navigate]);

    const editSchedule = useCallback((schedule) => {
        if (schedule)  {
            navigate('/schedules/edit' + (schedule.id ? ('/' + schedule.id) : ''));
        } else {
            navigate('/schedules/new');
        }
    }, [navigate]);

    const deleteSchedule = useCallback((id) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to discard this Schedule Draft? This action cannot be undone.',
            onConfirm: () => {
                discardScheduleDraft(id).then();
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
            fetchScheduleDrafts({include_users: true, include_leaves: true}).then();
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
                        <div className={'schedule-draft-item-content'}>
                            <div className={'group'} style={{width: '100%'}}>
                                <span className={'data'}>{schedule.description}</span>
                            </div>
                            <div className={'group'} style={{width: '100%'}}>
                                <span className={'label'}>Date range</span>
                                <span className={'data'}>{schedule.start_date} - {schedule.end_date}</span>
                            </div>
                            <div className={'group'}>
                                <span className={'label'}>Users</span>
                                <span className={'data'}>{Array.from(schedule.users?.keys() || []).length}</span>
                            </div>
                            <div className={'group'}>
                                <span className={'label'}>Shifts</span>
                                <span className={'data'}>{schedule.shifts?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    </>;
};

export default SchedulesIndex;