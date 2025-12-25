// FRONTEND/components/Projects/Index.js
import React, { useEffect, useMemo } from 'react';
import useApp from '../../contexts/AppContext';
import {useProjects} from '../../hooks/useResource';
import Table from '../Table';

const ProjectIndex = ({compact, transparent}) => {
    const { refreshTriggers } = useApp();
    const { projects, loading, fetchProjects } = useProjects();

    useEffect(() => {
        const refresh = refreshTriggers?.projects;
        if (refresh) delete refreshTriggers.projects;
        if (!projects || refresh) fetchProjects().then();
    }, [fetchProjects, projects, refreshTriggers.projects]);

    const header = useMemo(() => ({
        title: 'Projects',
        itemName: 'Project',
        allElements: new Set(projects?.map(team => team.id)),
        newItemModal: 'projectNew'
    }), [projects]);

    const fields = useMemo(() => ({
        0: {
            label: 'Name',
            name: 'name',
            type: 'string',
            openModal: 'projectDetails'
        },
        1: {
            label: 'Owners',
            name: 'owners',
            type: 'list',
            openModal: 'userDetails'
        },
        2: {
            label: 'Managers',
            name: 'managers',
            type: 'list',
            openModal: 'userDetails'
        },
        3: {
            label: 'Members',
            name: 'members',
            type: 'number',
            value: (data) => data.members?.length || 0,
            style: {maxWidth: '100px'}
        }
        }), []);

    return (
        <Table
            data={projects}
            header={header}
            fields={fields}
            columnHeaders={true}
            sortable={true}
            filterable={true}
            selectableRows={true}
            loading={loading}
            dataPlaceholder={'No Projects found.'}
            compact={compact}
            transparent={transparent}
        />
    );
};

export default ProjectIndex;