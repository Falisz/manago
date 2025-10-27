// FRONTEND/components/WorkPlanner/ScheduleEditor.jsx
import React, {useEffect, useMemo, useState} from 'react';
import useAppState from '../../contexts/AppStateContext';
import Button from "../Button";
import UserShiftTable from "./UserShiftTable";
import {generateDateList} from "../../utils/dates";
import '../../styles/Schedule.css';
import useUsers from "../../hooks/useUsers";
import Loader from "../Loader";

const ScheduleEditor = () => {
    const { appState } = useAppState();
    const { fetchUsers, loading, setLoading } = useUsers();
    const config = useMemo(() => appState.schedule_editor || {}, [appState.schedule_editor]);
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const [ users, setUsers ] = useState();
    const [ dateRange, setDateRange ] = useState({
        fromDate: config.fromDate,
        toDate: config.toDate,
    });

    useEffect(() => {
        setLoading(true);

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date.getTime()) ? date : null;
        };

        const fetchData = async () => {
            if (!config.users) {
                const userScope = config.user_scope || params.get('user_scope');
                let scopeId;

                try {
                    scopeId = parseInt(params.get('sid')) || config.user_scope_id;
                } catch {
                    scopeId = config.user_scope_id;
                }

                if (userScope && scopeId) {
                    const fetchedUsers = await fetchUsers({ userScope, scopeId, map: true });
                    setUsers(fetchedUsers);
                }

            } else {
                setUsers(config.users);
                setLoading(false);
            }

            const fromDate = parseDate(params.get('from')) || config.fromDate;
            const toDate = parseDate(params.get('to')) || config.toDate;

            setDateRange({ fromDate, toDate });
        };

        fetchData().then();

    }, [config, fetchUsers, params, setLoading]);

    if (!dateRange.fromDate || !dateRange.toDate)
        return <span>No time range specified.</span>;

    if (!users)
        return <span>No users specified.</span>;

    if (loading)
        return <Loader/>;


    const title = () => {
        if (!config.type)
            return "Empty Schedule"

        switch (config.type) {
            case 'new':
                return "New Schedule Draft";
            case 'current':
                return "Editing Published Schedule";
            default:
                return "Editing Schedule Draft: " + config.name;
        }
    }

    const dates = generateDateList(dateRange.fromDate, dateRange.toDate);

    return (
        <div className={'app-schedule seethrough'}>
            <div className={'app-schedule-header'}>
            <span style={{marginRight: 'auto', fontSize: '2rem'}}>{title()}</span>
            {config && config.type !== 'current' && <Button icon={'publish'} label={'Publish'}/>}
            {config && config.type === 'current' && <Button icon={'publish'} label={'Re-Publish'}/>}
            {config && config.type !== 'current' && <Button icon={'save'} label={'Save'}/>}
            {config && config.type === 'current' && <Button icon={'save'} label={'Save to Drafts'}/>}
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
