// FRONTEND/components/JobLocation/Details.js
import React from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useJobLocations} from '../../hooks/useResource';
import Details from "../Details";

const JobLocationDetails = ({ id, modal }) => {
    const { refreshTriggers, refreshData } = useApp();
    const { openPopUp, openModal, closeTopModal } = useNav();
    const { jobLocation, loading, fetchJobLocation, deleteJobLocation } = useJobLocations();

    React.useEffect(() => {
        const reload = refreshTriggers.jobLocation;
        if (reload) delete refreshTriggers.jobLocation;
        if (id && (!jobLocation || reload)) fetchJobLocation({id, reload}).then();
    }, [fetchJobLocation, jobLocation, id, refreshTriggers.jobLocation]);

    const handleDelete = React.useCallback(() => {
        let message = 'Are you sure you want to delete this Job Location? If there are any shifts using of this job post' +
            ' they will be left without a job post. This action cannot be undone.';

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteJobLocation({id});
                if (!success) return;
                refreshData('jobLocations', true);
                closeTopModal();
            },
        });
    }, [id, openPopUp, deleteJobLocation, refreshData, closeTopModal]);

    const header = React.useMemo(() => ({
        style: { borderColor: jobLocation?.color },
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
                onClick: () => openModal({content: 'jobLocationEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [jobLocation, openModal, id, handleDelete]);

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
        data={jobLocation}
        modal={modal}
        loading={loading}
        placeholder={'Job Location not found!'}
    />;
};

export default JobLocationDetails;