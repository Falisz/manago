// FRONTEND/components/Schedules/Index.jsx
import React, {useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useScheduleDrafts} from '../../hooks/useResource';
import Button from '../Button';
import Loader from '../Loader';
import '../../styles/Schedules.css';

const SchedulesIndex = () => {
    const { refreshTriggers, refreshData } = useApp();
    const { openModal, closeTopModal } = useNav();
    const { schedules, fetchSchedules, deleteSchedule, loading  } = useScheduleDrafts();
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

    const handleDelete = useCallback((id) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to discard this Schedule Draft? This action cannot be undone.',
            onConfirm: async () => {
                const success = await deleteSchedule({id});
                if (!success) return;
                refreshData('scheduleDrafts', true);
                closeTopModal();
            },
        });
    }, [closeTopModal, deleteSchedule, openModal, refreshData]);

    useEffect(() => {
        const refresh = refreshTriggers?.schedules || false;

        if (refresh)
            delete refreshTriggers.schedules;

        if (!schedules || refresh)
            fetchSchedules({include_users: true, include_leaves: true}).then();
    }, [refreshTriggers.schedules, schedules, fetchSchedules]);

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
                schedules && schedules.length > 0 && schedules.map((schedule, idx) =>
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
                                onClick={() => handleDelete(schedule.id)}
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