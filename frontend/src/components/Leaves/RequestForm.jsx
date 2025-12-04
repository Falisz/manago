import useApp from "../../contexts/AppContext";
import {useLeaves, useLeaveTypes} from "../../hooks/useResource";
import React, {useMemo} from "react";
import EditForm from "../EditForm";

const LeaveRequestForm = ({modal}) => {

    const { user } = useApp();
    const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
    const { saveLeave } = useLeaves();

    React.useEffect(() => {
        fetchLeaveTypes().then();
    }, [fetchLeaveTypes]);

    const sections = useMemo(() => ({
        0: {
            fields: {
                type: {
                    type: 'combobox',
                    label: 'Leave Type',
                    searchable: false,
                    required: true,
                    options: leaveTypes?.map(type => ({id: type.id, name: type.name})) || []
                }
            }
        },
        1: {
            fields: {
                start_date: {
                    type: 'date',
                    label: 'Start Date',
                    required: true,
                    max: (data) => data.end_date,
                },
                end_date: {
                    type: 'date',
                    label: 'End Date',
                    required: true,
                    min: (data) => data.start_date,
                },
                days: {
                    type: 'content',
                    label: 'Days',
                    content: (data) => {
                        let days = 0;

                        if (data.start_date && data.end_date) {
                            const start = new Date(data.start_date);
                            const end = new Date(data.end_date);

                            if (!isNaN(start) && !isNaN(end)) {
                                const diffInMs = end - start;
                                days = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
                            }
                        }
                        return <p>{days} days</p>;
                    }
                }
            }
        }
    }), [leaveTypes]);

    const presetData = useMemo(() => ({status: 0, user: user.id}), [user]);

    return (
        <EditForm
            header={'Leave Request'}
            sections={sections}
            onSubmit={async (data) => await saveLeave({data})}
            modal={modal}
            presetData={presetData}
        />
    );
};

export default LeaveRequestForm;