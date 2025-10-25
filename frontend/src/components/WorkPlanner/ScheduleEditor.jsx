// FRONTEND/components/WorkPlanner/ScheduleEditor.jsx
import React, {useEffect, useMemo, useState} from 'react';
import useAppState from '../../contexts/AppStateContext';
import Button from "../Button";
import UserShiftTable from "./UserShiftTable";
import {generateDateList} from "../../utils/dates";
import '../../styles/Schedule.css';
import useUser from "../../hooks/useUser";

const ScheduleEditor = () => {
    const { appState } = useAppState();
    const { fetchUsers } = useUser();
    const [ users, setUsers ] = useState();
    const config = useMemo(() => appState.schedule_editor || {}, [appState.schedule_editor]);
    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    useEffect(() => {
        if (!config.users) {
            if (!config.user_scope)
                config.user_scope = params.get('user_scope');
            if (!config.user_scope_id)
                try {
                    config.user_scope_id = parseInt(params.get('user_scope_id'));
                } catch {
                    return;
                }

            const userScope = config.user_scope;
            const userScopeId = config.user_scope_id;
            fetchUsers({userScope, userScopeId, map: true}).then(users => {
                config.users = users;
            });
        }

        if (!config.fromDate)
            try {
                config.fromDate = new Date(params.get('from'));
            } catch {
                return;
            }

        if (!config.toDate)
            try {
                config.toDate = new Date(params.get('to'));
            } catch {
                return;
            }

        setUsers(config.users);

    }, [config, fetchUsers, params]);

    if (!config.fromDate || !config.toDate)
        return <span>No time range specified.</span>;

    if (!config.users || !config.users.size)
        return <span>No users specified.</span>;


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
            <span style={{marginRight: 'auto', fontSize: '2rem'}}>{title()}</span>
            {config && config.type !== 'current' && <Button icon={'publish'} label={'Publish'}/>}
            {config && config.type === 'current' && <Button icon={'publish'} label={'Re-Publish'}/>}
            {config && config.type !== 'current' && <Button icon={'save'} label={'Save'}/>}
            {config && config.type === 'current' && <Button icon={'save'} label={'Save as Draft'}/>}
            </div>
            <UserShiftTable
                dates={dates}
                users={users}
                setUsers={setUsers}
                editable={true}
            />
        </div>
    );
}

export default ScheduleEditor;
