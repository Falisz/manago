// FRONTEND/components/Projects/Edit.js
import React, { useMemo} from 'react';
import {useProjects, useUsers} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const ProjectEdit = ({ id, modal }) => {
    const { project, loading, setLoading, fetchProject, saveProject } = useProjects();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();

    React.useEffect(() => {
        fetchUsers().then();
        fetchManagers({group: 'managers'}).then();
        if (id)
            fetchProject({id}).then();
        else
            setLoading(false);
    }, [id, setLoading, fetchProject, fetchUsers, fetchManagers]);

    const sections = React.useMemo(() => ({
        0: {
            fields: {
                name: {
                    type: 'string',
                    label: 'Name',
                    required: true
                },
                code_name: {
                    type: 'textarea',
                    label: 'Description'
                }
            }
        },
        1: {
            style: { flexDirection: 'column', flexWrap: 'nowrap' },
            fields: {
                owners: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Project Owners',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                },
                managers: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Project Managers',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                },
                developers: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Developers',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                },
                designers: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Designers',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                },
                testers: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Testers',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                },
                stakeholders: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Stakeholders',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'developers', 'designers', 'testers', 'stakeholders'] }
                }
            }
        }
    }), [managers, users]);

    const presetData = useMemo(() => project ? project : {}, [project]);

    if (loading) 
        return <Loader/>;

    return <EditForm
        header={id ? `Editing ${project?.name}` : 'Creating new Project'}
        sections={sections}
        onSubmit={async (data) => await saveProject({id, data})}
        modal={modal}
        presetData={presetData} 
    />;
}

export default ProjectEdit;