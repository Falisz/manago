// FRONTEND/components/Roles/Index.js
import React from 'react';
import { useLeaves, useRequestStatuses } from '../../hooks/useResource';

const LeavesIndex = () => {

    const { leaves, fetchLeaves } = useLeaves();
    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();

    React.useEffect(() => {
        fetchLeaves();
        fetchRequestStatuses();
    }, [fetchLeaves, fetchRequestStatuses]);

    return <div>
        <h1>Leaves</h1>
        {leaves && leaves.map(leave => (
            leave && <div key={leave.id}>
                <p>Leave ID: {leave.id}</p>
                <p>{Object.entries(leave).map(([key, value]) => <><b>{key}:</b> {value?.toString()}&nbsp;&nbsp;</>)}</p>
                <p>Status: {requestStatuses.find(status => status.id === leave.status)?.name || 'Unknown'}</p>
            </div>            
        ))}
    </div>
};

export default LeavesIndex;