// FRONTEND/components/Projects/Edit.js
import React, { useMemo} from 'react';
import {useProjects, useUsers} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const ProjectEdit = ({ id, modal }) => {
    const { project, loading, setLoading, fetchProject, saveProject } = useProjects();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();

    React.useEffect(() => {
        fetchManagers({group: 'managers'}).then();
        if (id)
            fetchProject({id}).then();
        else
            setLoading(false);
    }, [id, setLoading, fetchProject, fetchManagers]);

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
            fields: {
                owners: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Project Owners',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['owners', 'managers', 'members'] }
                }
            }
        },
        2: {
            fields: {
                managers: {
                    type: 'multi-dropdown',
                    array: true,
                    projectCompliance: true,
                    label: 'Project Managers',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['leaders', 'members'] }
                }
            }
        }
    }), [managers]);

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