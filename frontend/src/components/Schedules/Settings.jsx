// FRONTEND/Components/Schedules/Settings.jsx
import React, {useCallback, useMemo} from 'react';
import {useHolidays, useJobLocations, useJobPosts, useLeaveTypes} from '../../hooks/useResource';
import useApp from "../../contexts/AppContext";
import Table from "../Table";
import Icon from "../Icon";
import Button from "../Button";
import useNav from "../../contexts/NavContext";

const GeneralSettings = () => {
    const { appState, saveConfig } = useApp();
    const { openDialog } = useNav();

    const handleToggleConfirm = useCallback((config, value) => {
        openDialog({
            content: 'confirm',
            message: `Are you sure you want to ${!value ? 'enable' : 'disable'} this sub-module?` +
                (value ? ' All the data related to it will not be ' +
                    'accessible within the app until its reactivation.' : ''),
            onConfirm: () => saveConfig({[config]: !value}, false).then()
        });
    }, [openDialog, saveConfig]);

    const data = React.useMemo(() => {
        return Object.entries(appState.workPlanner)
            .sort(([a, _a], [b, _b]) => a.localeCompare(b))
            .map(([key, value]) => ({ title: key, enabled: value }));
    }, [appState]);

    const fields = useMemo(() => ({
        0: {
            name: 'title',
            type: 'string',
            style: {
                fontSize: '1.5rem',
                cursor: 'default',
                paddingLeft: '20px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-family-condensed)'
            }
        },
        2: {
            name: 'enabled',
            type: 'toggleSwitch',
            style: {textAlign: 'right', maxWidth: '200px'},
            checked: (data) => data.enabled,
            onChange: (data) => handleToggleConfirm(data.title, data.enabled),
            disabled: (data) => data.title === 'dispositions'
        }
    }), [handleToggleConfirm]);

    return (
        <Table
            data={data}
            fields={fields}
        />
    );
};

const Holidays = ({disabled}) => {
    const { refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { holidays, fetchHolidays, loading } = useHolidays();

    React.useEffect(() => {
        const reload = refreshTriggers.holidays;
        if (reload) delete refreshTriggers.holidays;
        if (!holidays || reload) fetchHolidays().then();
    }, [holidays, fetchHolidays, refreshTriggers.holidays]);

    const fields = useMemo(() => ({
        0: {
            name: 'date'
        },
        1: {
            name: 'name'
        }
    }), []);

    return (
        <Table
            data={holidays}
            fields={fields}
            columnHeaders={false}
            handleRowClick={(_e, data) =>
                !disabled && openDialog({content: 'holidayDetails', contentId: data.id, closeButton: false})}
            dataPlaceholder={'No Holidays found.'}
            loading={loading}
            compact transparent
        />
    );
};

const LeaveTypes = ({disabled}) => {
    const { refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { leaveTypes, fetchLeaveTypes, loading } = useLeaveTypes();

    React.useEffect(() => {
        const reload = refreshTriggers.leaveTypes;
        if (reload) delete refreshTriggers.leaveTypes;
        if (!leaveTypes || reload) fetchLeaveTypes().then();
    }, [leaveTypes, fetchLeaveTypes, refreshTriggers.leaveTypes]);

    const fields = useMemo(() => ({
        0: {
            name: 'name',
            value: (data) => <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Icon i={'circle'} style={{color: data.color}}/>{data.name}
            </span>
        }
    }), []);

    return (
        <Table
            data={leaveTypes}
            fields={fields}
            columnHeaders={false}
            dataPlaceholder={'No Leave Types found.'}
            handleRowClick={(_e, data) =>
                !disabled && openDialog({content: 'leaveTypeDetails', contentId: data.id, closeButton: false})}
            loading={loading}
            compact transparent
        />
    );
};

const JobPosts = ({disabled}) => {
    const { refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { jobPosts, fetchJobPosts, loading } = useJobPosts();

    React.useEffect(() => {
        const reload = refreshTriggers.jobPosts;
        if (reload) delete refreshTriggers.jobPosts;
        if (!jobPosts || reload) fetchJobPosts().then();
    }, [jobPosts, fetchJobPosts, refreshTriggers.jobPosts]);

    const fields = useMemo(() => ({
        0: {
            name: 'name',
            value: (data) => <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Icon i={'circle'} style={{color: data.color}}/>{data.name}
            </span>
        }
    }), []);

    return (
        <Table
            data={jobPosts}
            fields={fields}
            columnHeaders={false}
            dataPlaceholder={'No Job Posts found.'}
            handleRowClick={(_e, data) =>
                !disabled && openDialog({content: 'jobPostDetails', contentId: data.id, closeButton: false})}
            loading={loading}
            compact transparent
        />
    );
};

const JobLocations = ({disabled}) => {
    const { refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { jobLocations, fetchJobLocations, loading } = useJobLocations();

    React.useEffect(() => {
        const reload = refreshTriggers.jobLocations;
        if (reload) delete refreshTriggers.jobLocations;
        if (!jobLocations || reload) fetchJobLocations().then();
    }, [jobLocations, fetchJobLocations, refreshTriggers.jobLocations]);

    const fields = useMemo(() => ({
        0: {
            name: 'name',
            value: (data) => <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Icon i={'circle'} style={{color: data.color}}/>{data.name}
            </span>
        }
    }), []);

    return (
        <Table
            data={jobLocations}
            fields={fields}
            columnHeaders={false}
            dataPlaceholder={'No Job Locations found.'}
            handleRowClick={(_e, data) =>
                !disabled && openDialog({content: 'jobLocationDetails', contentId: data.id, closeButton: false})}
            loading={loading}
            compact transparent
        />
    );
};

const WorkPlannerSettings = () => {
    const { openDialog } = useNav();
    const { appState } = useApp();

    return (
        <>
            <section className={'general-settings'}>
                <h1>Work Planner Settings</h1>
                <GeneralSettings />
            </section>
            <section className={'holidays' + (!appState.workPlanner.holidays ? ' disabled' : '')}>
                <div className={'header'}>
                    <h1>Holidays</h1>
                    <Button
                        label={'New Holiday'}
                        icon={'add'}
                        onClick={() => appState.workPlanner.holidays && openDialog({content: 'holidayNew'})}
                        disabled={!appState.workPlanner.holidays}
                    />
                </div>
                <Holidays disabled={!appState.workPlanner.holidays}/>
            </section>
            <section className={'leave-types' + (!appState.workPlanner.leaves ? ' disabled' : '')}>
                <div className={'header'}>
                    <h1>Absence Types</h1>
                    <Button
                        label={'New Leave Type'}
                        icon={'add'}
                        onClick={() => openDialog({content: 'leaveTypeNew'})}
                        disabled={!appState.workPlanner.leaves}
                    />
                </div>
                <LeaveTypes disabled={!appState.workPlanner.leaves}/>
            </section>
            <section className={'job-posts' + (!appState.workPlanner.jobPosts ? ' disabled' : '')}>
                <div className={'header'}>
                    <h1>Job Posts</h1>
                    <Button
                        label={'New Job Post'}
                        icon={'add'}
                        onClick={() => openDialog({content: 'jobPostNew'})}
                        disabled={!appState.workPlanner.jobPosts}
                    />
                </div>
                <JobPosts disabled={!appState.workPlanner.jobPosts}/>
            </section>
            <section className={'job-locations' + (!appState.workPlanner.jobLocations ? ' disabled' : '')}>
                <div className={'header'}>
                    <h1>Job Locations</h1>
                    <Button
                        label={'New Job Location'}
                        icon={'add'}
                        onClick={() => openDialog({content: 'jobLocationNew'})}
                        disabled={!appState.workPlanner.jobLocations}
                    />
                </div>
                <JobLocations disabled={!appState.workPlanner.jobLocations}/>
            </section>
        </>
    );
};

export default WorkPlannerSettings;