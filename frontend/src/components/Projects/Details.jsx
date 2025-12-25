// FRONTEND/components/Projects/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useProjects} from '../../hooks/useResource';
import Details from '../Details';
import {formatDate} from "../../utils/dates";

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
                    dataField: 'start_date',
                    format: (data) => formatDate(new Date(data))
                },
                2: {
                    label: 'End Date',
                    dataField: 'end_date',
                    format: (data) => formatDate(new Date(data)),
                    hideEmpty: true
                }
            }
        },
        1: {
            header: 'Members',
            fields: {
                0: {
                    label: 'Project Owners',
                    dataType: 'list',
                    dataField: 'owners',
                    placeholder: 'No Owners assigned.',
                    items: userStructure
                },
                1: {
                    label: 'Project Managers',
                    dataType: 'list',
                    dataField: 'managers',
                    placeholder: 'No Managers assigned.',
                    items: userStructure
                },
                2: {
                    label: 'Developers',
                    dataType: 'list',
                    dataField: 'developers',
                    hideEmpty: true,
                    items: userStructure
                },
                3: {
                    label: 'Designers',
                    dataType: 'list',
                    dataField: 'designers',
                    hideEmpty: true,
                    items: userStructure
                },
                4: {
                    label: 'Testers',
                    dataType: 'list',
                    dataField: 'testers',
                    hideEmpty: true,
                    items: userStructure
                },
                5: {
                    label: 'Stakeholders',
                    dataType: 'list',
                    dataField: 'stakeholders',
                    hideEmpty: true,
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