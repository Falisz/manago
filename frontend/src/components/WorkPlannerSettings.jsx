// FRONTEND/Components/WorkPlannerSettings.jsx
import React, {useMemo} from 'react';
import {useHolidays, useJobPosts} from '../hooks/useResource';
import '../styles/WorkPlannerSettings.css';
import useApp from "../contexts/AppContext";
import Table from "./Table";
import Icon from "./Icon";

const Holidays = () => {

    const { refreshTriggers } = useApp();
    const { holidays, fetchHolidays, loading } = useHolidays();

    React.useEffect(() => {
        const reload = refreshTriggers.holidays;
        if (reload) delete refreshTriggers.holidays;
        if (!holidays || reload) fetchHolidays().then();
    }, [holidays, fetchHolidays, refreshTriggers.holidays]);

    const fields = useMemo(() => ({
        0: {
            label: 'Date',
            name: 'date'
        },
        1: {
            label: 'Name',
            name: 'name'
        }
    }), []);

    return (
        <Table
            className={'page-section holidays'}
            header={{title: 'Holidays'}}
            data={holidays}
            fields={fields}
            dataPlaceholder={'No Holidays found.'}
            loading={loading}
        />
    );
};

const JobPosts = () => {

    const { refreshTriggers } = useApp();
    const { jobPosts, fetchJobPosts, loading } = useJobPosts();

    React.useEffect(() => {
        const reload = refreshTriggers.jobPosts;
        if (reload) delete refreshTriggers.jobPosts;
        if (!jobPosts || reload) fetchJobPosts().then();
    }, [jobPosts, fetchJobPosts, refreshTriggers.jobPosts]);

    const fields = useMemo(() => ({
        0: {
            label: 'Name',
            name: 'name',
            value: (data) => <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Icon i={'circle'} style={{color: data.color}}/>{data.name}
            </span>
        }
    }), []);

    return (
        <Table
            className={'page-section job-posts'}
            header={{title: 'Job Posts'}}
            columnHeaders={false}
            data={jobPosts}
            fields={fields}
            dataPlaceholder={'No Job Posts found.'}
            loading={loading}
        />
    );
};

const WorkPlannerSettings = () => {
    return (
        <div className={'work-planner-settings'}>
            <div className={'page-section general-settings'}>
                <h1>Work Planner General Settings</h1>
            </div>
            <Holidays />
            <div className={'page-section leave-types'}>
                <h1>Leave Types</h1>
            </div>
            <JobPosts />
            <div className={'page-section job-locations'}>
                <h1>Job Locations</h1>
            </div>
        </div>
    );
};

export default WorkPlannerSettings;