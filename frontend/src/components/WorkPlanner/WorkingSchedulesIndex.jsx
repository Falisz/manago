// FRONTEND/components/WorkPlanner/WorkingSchedulesIndex.jsx
import React, {useCallback, useEffect, useMemo} from 'react';
import Button from '../Button';
import {useModals} from '../../contexts/ModalContext';
import useAppState from '../../contexts/AppStateContext';
import {useNavigate} from 'react-router-dom';
import {formatDate} from '../../utils/dates';
import useScheduleDrafts from '../../hooks/useScheduleDrafts';
import useUsers from "../../hooks/useUsers";

const ScheduleDraftItem = ({schedule}) => {

    const { setScheduleEditor } = useAppState();
    const { users, fetchUsers } = useUsers();
    const navigate = useNavigate();
    const { closeTopModal } = useModals();

    const startDate = useMemo(() => new Date(schedule.start_date), [schedule]);
    const endDate = useMemo(() => new Date(schedule.end_date), [schedule]);

    const editSchedule = useCallback(() => {
        console.log(schedule);
        setScheduleEditor({
            type: 'working',
            fromDate: startDate,
            toDate: endDate,
            user: users,
            ...schedule
        });
        navigate('/planner/editor');
        closeTopModal();
    }, [setScheduleEditor, users, closeTopModal, navigate, schedule, startDate, endDate]);

    useEffect(() => {
        fetchUsers({userScope: schedule.user_scope, scopeId: schedule.user_scope_id }).then();
    },[])

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
                    onClick={editSchedule}
                />
                <Button
                    icon={'delete'}
                    title={'Delete'}
                    transparent={true}
                />
            </div>
            <div className={'schedule-draft-item-description'}>
                Date range: {formatDate(startDate)} - {formatDate(endDate)}<br/>
                Shifts: {schedule.shifts && schedule.shifts.length}<br/>
                Users: {users && users.length}<br/>
                Note: {schedule.description}
            </div>
        </div>
    );
}

const WorkingScheduleIndex = () => {

    const { scheduleDrafts, fetchScheduleDrafts  } = useScheduleDrafts();

    useEffect(() => {
        fetchScheduleDrafts({include_shifts: true}).then();
    }, [fetchScheduleDrafts]);

    return (
        <>
            {scheduleDrafts && scheduleDrafts.length > 0 &&
                scheduleDrafts.map((schedule, idx) => <ScheduleDraftItem key={idx} schedule={schedule}/>)
            }
        </>
    );
};

export default WorkingScheduleIndex;