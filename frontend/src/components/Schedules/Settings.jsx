// FRONTEND/Components/Schedules/Settings.jsx
import React, {useMemo} from 'react';
import {useHolidays, useJobLocations, useJobPosts, useLeaveTypes} from '../../hooks/useResource';
import useApp from "../../contexts/AppContext";
import Table from "../Table";
import Icon from "../Icon";
import Button from "../Button";
import useNav from "../../contexts/NavContext";

const GeneralSettings = () => {
    return (
        <>
            General Settings here.
        </>
    );
};

const Holidays = () => {
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
            handleRowClick={(_e, data) => openDialog({content: 'holiday', contentId: data.id, closeButton: false})}
            dataPlaceholder={'No Holidays found.'}
            loading={loading}
            compact transparent
        />
    );
};

const LeaveTypes = () => {
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
            handleRowClick={(_e, data) => openDialog({content: 'leaveTypeDetails', contentId: data.id, closeButton: false})}
            loading={loading}
            compact transparent
        />
    );
};

const JobPosts = () => {
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
            handleRowClick={(_e, data) => openDialog({content: 'jobPost', contentId: data.id})}
            loading={loading}
            compact transparent
        />
    );
};

const JobLocations = () => {
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
            handleRowClick={(_e, data) => openDialog({content: 'jobLocation', contentId: data.id})}
            loading={loading}
            compact transparent
        />
    );
};

const WorkPlannerSettings = () => {
    const { openDialog } = useNav();

    return (
        <>
            <section className={'general-settings'}>
                <h1>Work Planner Settings</h1>
                <GeneralSettings />
            </section>
            <section className={'holidays'}>
                <div className={'header'}>
                    <h1>Holidays</h1>
                    <Button
                        label={'New Holiday'}
                        icon={'add'}
                        onClick={() => openDialog({content: 'holidayNew'})}
                    />
                </div>
                <Holidays />
            </section>
            <section className={'leave-types'}>
                <div className={'header'}>
                    <h1>Leave Types</h1>
                    <Button
                        label={'New Leave Type'}
                        icon={'add'}
                        onClick={() => openDialog({content: 'leaveTypeNew'})}
                    />
                </div>
                <LeaveTypes />
            </section>
            <section className={'job-posts'}>
                <div className={'header'}>
                    <h1>Job Posts</h1>
                    <Button
                        label={'New Job Post'}
                        icon={'add'}
                    />
                </div>
                <JobPosts />
            </section>
            <section className={'job-locations'}>
                <div className={'header'}>
                    <h1>Job Locations</h1>
                    <Button
                        label={'New Job Location'}
                        icon={'add'}
                    />
                </div>
                <JobLocations />
            </section>
        </>
    );
};

export default WorkPlannerSettings;