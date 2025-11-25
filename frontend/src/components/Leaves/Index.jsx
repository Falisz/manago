// FRONTEND/components/Roles/Index.js
import React, {useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import { useLeaves, useRequestStatuses, useLeaveTypes } from '../../hooks/useResource';
import Button from "../Button";
import EditForm from "../EditForm";

const LeaveRequestForm = () => {

    const { user } = useApp();
    const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
    const { saveLeave } = useLeaves();

    React.useEffect(() => {
        fetchLeaveTypes().then();
    }, [fetchLeaveTypes]);

    const fields = useMemo(() => ({
        type: {
            section: 0,
            type: 'string',
            inputType: 'combobox',
            label: 'Leave Type',
            searchable: false,
            required: true,
            options: leaveTypes?.map(type => ({id: type.id, name: type.name})) || []
        },
        start_date: {
            section: 1,
            type: 'date',
            inputType: 'date',
            label: 'Start Date',
            required: true,
            max: (data) => data.end_date,
        },
        end_date: {
            section: 1,
            type: 'date',
            inputType: 'date',
            label: 'End Date',
            required: true,
            min: (data) => data.start_date,
        },
        days: {
            section: 1,
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
    }), [leaveTypes]);

    const presetData = useMemo(() => ({status: 0, user: user.id}), [user]);

    return (
        <EditForm
            header={'Leave Request'}
            fields={fields}
            onSubmit={async (formData) => await saveLeave({formData})}
            presetData={presetData}
        />
    );
};

const YourLeaves = () => {

    const { user } = useApp();
    const { openModal } = useNav();
    const { leaves, fetchLeaves } = useLeaves();
    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();

    React.useEffect(() => {
        fetchLeaves({ user: user.id });
        fetchRequestStatuses();
    }, [fetchLeaves, fetchRequestStatuses, user.id]);

    return (
        <div className='seethrough' style={{padding: '20px', width: 'calc(100% - 40px)', marginBottom: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h1 style={{margin: '0', fontWeight: '100'}}>Your Leaves</h1>
                <Button
                    label={'Request new Leave'}
                    onClick={() => openModal({content: 'component', component: LeaveRequestForm})}
                />
            </div>
            {leaves?.map(leave => (
                leave &&
                <div key={leave.id}>
                    <p>{Object.entries(leave).map(([key, value]) => <><b>{key}:</b> {value?.toString()}&nbsp;&nbsp;</>)}</p>
                    <p>Status: {requestStatuses?.find(status => status.id === leave.status)?.name || 'Unknown'}</p>
                </div>
            ))}
        </div>
    );
};


const LeaveRequests = () => {

    return (
        <div className='seethrough'>
            <h1>Leave Requests</h1>
        </div>
    );

};

const LeavesIndex = () => {

    return (
        <>
            <YourLeaves />
            <LeaveRequests />
        </>
    );
};

export default LeavesIndex;