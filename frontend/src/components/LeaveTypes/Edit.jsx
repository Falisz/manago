// FRONTEND/components/LeaveTypes/Edit.js
import React from 'react';
import {useLeaveTypes} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const LeaveTypeEdit = ({ id, modal }) => {
    const { leaveType, loading, setLoading, fetchLeaveType, saveLeaveType } = useLeaveTypes();

    React.useEffect(() => {
        if (id)
            fetchLeaveType({id}).then();
        else
            setLoading(false);

    }, [id, setLoading, fetchLeaveType]);

    const sections = React.useMemo(() => ({
        0: {
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
                },
                plannable: {
                    type: 'checkbox',
                    label: 'Plannable?'
                },
            }
        }
    }), []);

    const presetData = React.useMemo(() => {
        return leaveType ? leaveType : {};
    }, [leaveType]);

    if (loading)
        return <Loader />;

    return <EditForm
        header={id && leaveType ? `Editing ${leaveType.name} (Absence Type)` : 'Creating new Absence Type'}
        sections={sections}
        onSubmit={async (data) => await saveLeaveType({id, data}) }
        modal={modal}
        presetData={presetData}
    />;
};

export default LeaveTypeEdit;