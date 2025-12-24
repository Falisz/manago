// FRONTEND/components/JobPosts/Edit.js
import React from 'react';
import {useJobPosts} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const JobPostEdit = ({ id, modal }) => {
    const { jobPost, loading, setLoading, fetchJobPost, saveJobPost } = useJobPosts();

    React.useEffect(() => {
        if (id)
            fetchJobPost({id}).then();
        else
            setLoading(false);

    }, [id, setLoading, fetchJobPost]);

    const sections = React.useMemo(() => ({
        0: {
            style: { flexDirection: 'column' },
            fields: {
                name: {
                    type: 'input',
                    label: 'Name',
                    required: true
                },
                abbreviation: {
                    type: 'input',
                    label: 'Abbreviation'
                },
                color: {
                    type: 'color',
                    label: 'Color'
                }
            }
        }
    }), []);

    const presetData = React.useMemo(() => {
        return jobPost ? jobPost : {};
    }, [jobPost]);

    if (loading)
        return <Loader />;

    return <EditForm
        header={id && jobPost ? `Editing ${jobPost.name}` : 'Creating new Job Post'}
        sections={sections}
        onSubmit={async (data) => await saveJobPost({id, data}) }
        modal={modal}
        presetData={presetData}
    />;
};

export default JobPostEdit;