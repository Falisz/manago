// FRONTEND/components/JobPosts/Details.js
import React from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useJobPosts} from '../../hooks/useResource';
import Details from "../Details";

const JobPostDetails = ({ id, modal }) => {
    const { refreshTriggers, refreshData } = useApp();
    const { openPopUp, openModal, closeTopModal } = useNav();
    const { jobPost, loading, fetchJobPost, deleteJobPost } = useJobPosts();

    React.useEffect(() => {
        const reload = refreshTriggers.jobPost;
        if (reload) delete refreshTriggers.jobPost;
        if (id && (!jobPost || reload)) fetchJobPost({id, reload}).then();
    }, [fetchJobPost, jobPost, id, refreshTriggers.jobPost]);

    const handleDelete = React.useCallback(() => {
        let message = 'Are you sure you want to delete this Job Post? If there are any Shifts using this Job Post' +
            ' they will be left without a Job Post. This action cannot be undone.';

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteJobPost({id});
                if (!success) return;
                refreshData('jobPosts', true);
                closeTopModal();
            },
        });
    }, [id, openPopUp, deleteJobPost, refreshData, closeTopModal]);

    const header = React.useMemo(() => ({
        style: { borderColor: jobPost?.color },
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Leave Type ID',
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'jobPostEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [jobPost, openModal, id, handleDelete]);

    const sections = React.useMemo(() => ({
        0: {
            style: { flexDirection: 'row', gap: '20px' },
            fields: {
                0: {
                    label: 'Abbreviated Name',
                    dataField: 'abbreviation',
                    hideEmpty: true
                },
                1: {
                    label: 'Color',
                    dataField: 'color',
                    format: (value) =>
                        <span style={{padding: '2px 5px', background: value, borderRadius: '10px'}}>{value}</span>
                },
                2: {
                    label: 'Description',
                    dataField: 'description',
                    hideEmpty: true
                }
            }
        }
    }), []);

    return <Details
        header={header}
        sections={sections}
        data={jobPost}
        modal={modal}
        loading={loading}
        placeholder={'Job Post not found!'}
    />;
};

export default JobPostDetails;