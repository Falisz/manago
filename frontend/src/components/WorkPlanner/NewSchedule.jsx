// FRONTEND/components/WorkPlanner/NewSchedule.jsx
import {useCallback} from 'react';
import Button from '../Button';
import {useNavigate} from 'react-router-dom';
import useAppState from '../../contexts/AppStateContext';
import ScheduleSelector from './ScheduleSelector';
import {useModals} from '../../contexts/ModalContext';
import useSchedules from '../../hooks/useSchedules';

const NewSchedule = () => {

    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();
    const { schedule, setSchedule } = useSchedules();

    const { closeTopModal } = useModals();

    const newSchedule = useCallback(() => {

        // Before navigating to the planner editor, we save the validated schedule draft to the server.

        setScheduleEditor({
            ...schedule,
            type: 'new'
        });

        navigate('/planner/editor');
        
        setTimeout(() => {
            closeTopModal();
        }, 100);
    }, [setScheduleEditor, navigate, schedule, closeTopModal]);

    const selectedUsers = schedule.users?.size > 0 ? Array.from(schedule.users.values()) : [];
    
    return <>
        <h1>New Schedule Draft</h1>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div
                className={'app-form'}
                style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '10px'
                }}
            >
                <label>Schedule name</label>
                <input
                    className={'form-input'}
                    type='text'
                    placeholder='Schedule name'
                    onChange={(e) => setSchedule(prev => ({...prev, name: e.target.value}))}
                    required={true}
                />
                <label>Schedule description</label>
                <textarea
                    className={'form-input'}
                    placeholder='Schedule description (optional)'
                    onChange={(e) => setSchedule(prev => ({...prev, description: e.target.value}))}
                />
            </div>
        <ScheduleSelector
            schedule={schedule}
            setSchedule={setSchedule}
            include_teams={true}
            include_branches={true}
            include_projects={true}
            include_specific={true}
            inRow={false}
        />
        <div style={{padding: '0 20px 10px'}}><b>Selected Users ({selectedUsers.length}):</b><br/>
            {schedule.placeholder ? schedule.placeholder : selectedUsers.length > 0 && selectedUsers.map(user => user.first_name + ' ' + user.last_name).join(', ')
        }</div>
        <Button onClick={newSchedule} disabled={!schedule.group || !schedule.groupId}>Start planning!</Button>
        </div>
    </>;

}

export default NewSchedule