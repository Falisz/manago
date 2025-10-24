// FRONTEND/components/WorkPlanner/NewSchedule.jsx
import {useCallback, useState} from "react";
import Button from "../Button";
import {useNavigate} from "react-router-dom";
import useAppState from "../../contexts/AppStateContext";
import ScheduleSelector from "./ScheduleSelector";
import {useModals} from "../../contexts/ModalContext";
import Loader from "../Loader";

const NewSchedule = () => {

    const { setScheduleEditor } = useAppState();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState({
        type: 'new',
        fromDate: new Date(),
        toDate: new Date(),
        group: null,
        groupId: null,
        users: []
    });
    const { closeTopModal } = useModals();

    const newSchedule = useCallback(() => {
        setScheduleEditor(schedule);
        navigate('/planner/editor');
        setTimeout(() => {
            closeTopModal();
        }, 100);
    }, [setScheduleEditor, navigate, schedule, closeTopModal]);

    console.log(schedule);
    return <>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <p>Specify users and dates range.</p>
        <ScheduleSelector
            schedule={schedule}
            setSchedule={setSchedule}
            include_teams={true}
            include_branches={true}
            include_projects={true}
            include_specific={true}
            date_range={true}
            monthly={false}
            inRow={false}
        />
        <p><b>Selected Users ({schedule.users.length}):</b><br/>
            {schedule.loading ? <Loader/> : schedule.users.length > 0 && schedule.users.map(user => user.first_name + ' ' + user.last_name).join(', ')
        }</p>
        <Button onClick={newSchedule} disabled={!schedule.group || !schedule.groupId}>Start planning!</Button>
        </div>
    </>;

}

export default NewSchedule