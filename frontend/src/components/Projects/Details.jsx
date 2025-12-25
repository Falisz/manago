// FRONTEND/components/Projects/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useProjects} from '../../hooks/useResource';
import Details from '../Details';

const ProjectDetails = ({ id, modal }) => {
    const { project, loading, fetchProject, deleteProject } = useProjects();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openDialog, openPopUp, closeTopModal } = useNav();

    useEffect(() => {
        const reload = refreshTriggers?.project?.data === id;
        if (reload) delete refreshTriggers.project;
        if (id && (!project || reload)) fetchProject({id, reload}).then();
    }, [fetchProject, project, id, refreshTriggers.project]);

    const handleDelete = useCallback(() => {
        let message = `Are you sure you want to delete this Project? This action cannot be undone.`

        const membersCount = project?.members?.length ?? 0;

        if (membersCount > 0)
            message += ` There are currently ${membersCount === 1 ? 'a' : membersCount}
             user${membersCount > 1 ? 's' : ''} assigned to this project.`

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteProject({id});
                if (!success) return;
                refreshData('projects', true);
                closeTopModal();
            },
            confirmLabel: 'Delete the Project',
        });
    }, [project, id, openPopUp, deleteProject, refreshData, closeTopModal]);
    
    const userStructure = useMemo(() => ({
        idField: 'id',
        dataField: ['first_name', 'last_name'],
        onClick: (id) => openDialog({ content: 'userDetails', contentId: id, closeButton: false }),
        suffix: {
            dataField: 'project',
            idField: 'id',
            nameField: 'name',
            condition: 'neq',
            onClick: (id) => openDialog({content: 'projectDetails', contentId: id, closeButton: false }),
        }
    }), [openDialog]);

    const header = useMemo(() => ({
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Project ID'
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'projectEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [openModal, id, handleDelete]);

    const sections = useMemo(() => ({
        0: {
            header: 'Details',
            fields: {
                0: {
                    label: 'Description',
                    dataField: 'description'
                },
                1: {
                    label: 'Start Date',
                    dataField: 'start_date'
                },
                2: {
                    label: 'End Date',
                    dataField: 'end_date',
                    hideEmpty: true
                }
            }
        },
        1: {
            header: 'Members',
            fields: {
                0: {
                    type: 'data-group',
                    label: 'Project Owners',
                    dataType: 'list',
                    dataField: 'owners',
                    placeholder: 'No Owners assigned.',
                    items: userStructure
                },
                1: {
                    type: 'data-group',
                    label: 'Project Managers',
                    dataType: 'list',
                    dataField: 'managers',
                    placeholder: 'No Managers assigned.',
                    items: userStructure
                },
                2: {
                    type: 'data-group',
                    label: 'Project Members',
                    dataType: 'list',
                    dataField: 'members',
                    placeholder: 'No Members assigned.',
                    items: userStructure
                }
            }
        }
    }), [userStructure]);

    return <Details
        header={header}
        sections={sections}
        data={project}
        modal={modal}
        loading={loading}
        placeholder={'Project not found!'}
    />;
};

export default ProjectDetails;