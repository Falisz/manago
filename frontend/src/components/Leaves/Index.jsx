// FRONTEND/components/Roles/Index.js
import React, {useCallback, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useLeaves, useRequestStatuses, useLeaveTypes, useUsers} from '../../hooks/useResource';
import Button from "../Button";
import EditForm from "../EditForm";
import Loader from "../Loader";
import Table from "../Table";
import '../../styles/Leaves.css';

// TODO: Leave Item component
const LeaveItem = ({leave, requestStatuses}) => {

    const { refreshData } = useApp();
    const { openModal, openDialog, closeTopModal } = useNav();
    const { saveLeave, deleteLeave } = useLeaves();

    const handleDiscard = useCallback(() => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to delete this planned Leave?',
            onConfirm: async () => {
                const success = await deleteLeave({id: leave.id});
                if (!success) return;
                refreshData('leaves', true);
                closeTopModal();
            },
        });

    }, [openModal, deleteLeave, refreshData, closeTopModal, leave.id]);

    const handleCancel = useCallback(() => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to request for cancelation?',
            onConfirm: async () => {
                const success = await saveLeave({id: leave.id, data: {status: 4}});
                if (!success) return;
                refreshData('leaves', true);
                closeTopModal();
            },
        });
    }, [openModal, saveLeave, refreshData, closeTopModal, leave.id]);

    if (!leave)
        return null;

    const { id, type, color, start_date, end_date, days, user_note, approver, approver_note, status } = leave;

    return (
        <div className={'index-leave-item'}>
            <div className={'index-leave-item-header'}>
                <h2
                    className={'app-clickable'}
                    style={{color}}
                    onClick={()=>openDialog({content: 'leaveDetails', contentId: id})}
                >{type || 'Leave'}</h2>
                {(status === 0 || status === 1) && 
                    <Button icon={'delete'} transparent title={'Discard'} onClick={handleDiscard}/>}
                {status === 2 && 
                    <Button icon={'cancel'} transparent title={'Request Cancelation'} onClick={handleCancel}/>}
            </div>
            <p>{start_date} - {end_date} ({days} day{days !== 1 && 's'})</p>
            {user_note && <p>{user_note}</p>}
            <p>Status: {requestStatuses?.find(s => s.id === status)?.name || 'Unknown'}</p>
            {approver && <p>Approved by: {approver.first_name} {approver.last_name}</p>}
            {approver_note && <p>{approver_note}</p>}
        </div>
    );
};


export const LeaveRequestForm = ({modal}) => {

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

const YourLeaves = ({requestStatuses}) => {
    const { user, refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { leaves, loading, fetchLeaves } = useLeaves();

    React.useEffect(() => {
        const refresh = refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh || !leaves) fetchLeaves({ user: user.id });
    })

    return (
        <div className={'leave-page-section seethrough'}>
            <div className={'leave-page-section-header'}>
                <h1>Your Leaves</h1>
                <Button
                    label={'Request new Leave'}
                    onClick={() => openDialog({content: 'leaveNew'})}
                />
            </div>
            <div className={'leaves-container app-scroll'}>
                {loading && <Loader/>}
                {!loading && leaves?.map(leave =>
                    <LeaveItem key={leave.id} leave={leave} requestStatuses={requestStatuses}/>)}
            </div>
        </div>
    );
};


const LeaveRequests = ({requestStatuses}) => {

    const { user } = useApp();
    const { openDialog } = useNav();
    const { users, fetchUsers } = useUsers();
    const { leaves, loading, fetchLeaves } = useLeaves();

    React.useEffect(() => {
        fetchUsers({ user_scope: 'manager', user_scope_id: user.id }).then();
    }, [fetchUsers, user.id]);

    React.useEffect(() => {
        if (!users) return;
        fetchLeaves({ user: users.map(u => u.id) }).then();
    }, [fetchLeaves, users]);

    const fields = useMemo(() => ({
        0: {
            label: 'Leave',
            name: 'type',
            type: 'string',
            style: {cursor: 'pointer'},
            onClick: (data) => openDialog({content: 'leaveDetails', contentId: data.id})
        },
        1: {
            label: 'User',
            name: 'user',
            type: 'item',
            openModal: 'userDetails'
        },
        2: {
            label: 'From',
            name: 'start_date',
            type: 'string',
        },
        3: {
            label: 'To',
            name: 'end_date',
            type: 'string'
        },
        4: {
            label: 'Status',
            name: 'status',
            value: (data) => requestStatuses?.find(s => s.id === data.status)?.name
        }
    }), [requestStatuses, openDialog]);

    return (
        <div className='leave-page-section seethrough'>
            <div className={'leave-page-section-header'}>
                <h1>Leave Requests</h1>
            </div>
            <div className={'leaves-container app-scroll'}>
                {loading && <Loader/>}
                {!loading && leaves &&
                    <Table
                        style={{width: '100%'}}
                        data={leaves}
                        fields={fields}
                        dataPlaceholder={'No leave requests found.'}
                    />
                }
            </div>
        </div>
    );

};

const LeavesIndex = () => {

    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();

    React.useEffect(() => {
        fetchRequestStatuses();
    }, [fetchRequestStatuses]);

    return (
        <div className={'leaves-page'}>
            <YourLeaves requestStatuses={requestStatuses}/>
            <LeaveRequests requestStatuses={requestStatuses}/>
        </div>
    );
};

export default LeavesIndex;