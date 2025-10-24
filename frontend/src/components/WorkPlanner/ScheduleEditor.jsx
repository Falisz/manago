// FRONTEND/components/WorkPlanner/ScheduleEditor.jsx
import React from 'react';
import useAppState from '../../contexts/AppStateContext';
import Button from "../Button";
import UserShiftTable from "./UserShiftTable";
import {generateDateList} from "../../utils/dates";
import '../../styles/Schedule.css';

const ScheduleEditor = () => {

    const { appState } = useAppState();

    const config = appState.schedule_editor;

    if (!config) return null;

    const title = () => {
        if (!config.type) return "No Schedule chosen"
        switch (config.type) {
            case 'new':
                return "Planning a New Schedule";
            case 'current':
                return "Editing Published Schedule";
            default:
                return "Editing Schedule: " + config.name;
        }
    }

    const dates = generateDateList(config.fromDate, config.toDate);

    return (
        <div style={{width: 'calc(100% - 20px)', padding: '30px'}}>
            <div className={'schedule-editor-header'} style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between'}}>
            <span style={{marginRight: 'auto'}}>{title()}</span>
            {config && config.type !== 'current' && <Button icon={'publish'} label={'Publish'}/>}
            {config && config.type === 'current' && <Button icon={'publish'} label={'Re-Publish'}/>}
            {config && config.type !== 'current' && <Button icon={'save'} label={'Save'}/>}
            {config && config.type === 'current' && <Button icon={'save'} label={'Save as Draft'}/>}
            </div>
            <UserShiftTable
                dates={dates}
                users={config.users}
                editable={true}
            />
        </div>
    );
}

export default ScheduleEditor;
