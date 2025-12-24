// FRONTEND/components/JobLocations/Edit.js
import React from 'react';
import {useJobLocations} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const JobLocationEdit = ({ id, modal }) => {
    const { jobLocation, loading, setLoading, fetchJobLocation, saveJobLocation } = useJobLocations();

    React.useEffect(() => {
        if (id)
            fetchJobLocation({id}).then();
        else
            setLoading(false);

    }, [id, setLoading, fetchJobLocation]);

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
        return jobLocation ? jobLocation : {};
    }, [jobLocation]);

    if (loading)
        return <Loader />;

    return <EditForm
        header={id && jobLocation ? `Editing Job Location` : 'Creating new Job Location'}
        sections={sections}
        onSubmit={async (data) => await saveJobLocation({id, data}) }
        modal={modal}
        presetData={presetData}
    />;
};

export default JobLocationEdit;