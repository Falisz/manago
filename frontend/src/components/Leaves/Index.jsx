// FRONTEND/components/Roles/Index.js
import React, {useCallback, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useLeaves, useLeaveTypes} from '../../hooks/useResource';
import Button from '../Button';
import Loader from '../Loader';
import Table from '../Table';
import '../../styles/Leaves.css';

const LeaveItem = ({leave}) => {

    const { openPopUp, openDialog, closeTopModal } = useNav();
    const { saveLeave, deleteLeave } = useLeaves();

    const handleCancel = useCallback(() => {

        const discard = leave.status.id === 0 || leave.status.id === 1;
        const message = discard ?
            'Are you sure you want to delete this Planned Leave?' :
            'Are you sure you want to request for cancellation of this Leave?';

        openPopUp({
            content: 'confirm',
            message,
            onConfirm: async () => {
                const success = discard ?
                    await deleteLeave({id: leave.id}) :
                    await saveLeave({id: leave.id, data: {status: 4}});
                if (!success) return;
                closeTopModal();
            },
        });
    }, [openPopUp, saveLeave, deleteLeave, closeTopModal, leave.id, leave.status]);

    if (!leave)
        return null;

    const { id, type, start_date, end_date, days, user_note, status } = leave;

    return (
        <div className={'index-leave-item'}>
            <div className={'index-leave-item-header'}>
                <h2
                    className={'app-clickable'}
                    style={{color: type.color}}
                    onClick={()=>openDialog({content: 'leaveDetails', contentId: id, closeButton: false})}
                >{type.name || 'Leave'}</h2>
                {(status.id === 0 || status.id === 1) &&
                    <Button icon={'remove_circle'} transparent title={'Discard'} onClick={handleCancel}/>}
                {status.id === 2 &&
                    <Button icon={'cancel'} transparent title={'Request Cancellation'} onClick={handleCancel}/>}
            </div>
            <p>{start_date} - {end_date} ({days} day{days !== 1 && 's'})</p>
            {user_note && <p>{user_note}</p>}
            <p><i>{status?.name || 'Unknown status'}</i></p>
        </div>
    );
};

const YourBalance = () => {

    const { fetchLeaveBalance } = useLeaves();
    const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
    const [ leaveBalance, setLeaveBalance ] = React.useState({});

    React.useEffect(() => {
        fetchLeaveTypes().then();
        fetchLeaveBalance().then(res => setLeaveBalance(res));
    }, [fetchLeaveTypes, fetchLeaveBalance, setLeaveBalance]);

    const yourBalance = useMemo(() => {
        return leaveTypes?.map( leave => ({...leave, ...leaveBalance[leave.id]}) );
    }, [leaveTypes, leaveBalance]);

    const fields = useMemo(() => ({
        0: {
            name: 'name',
            label: 'Leave Type'
        },
        1: {
            name: 'totalBalance',
            label: 'Total Balance',
            placeholder: '-'
        },
        2: {
            name: 'usedBalance',
            label: 'Used Balance'
        },
        3: {
            name: 'availableBalance',
            label: 'Available Balance',
            placeholder: '-'
        }
    }), [])

    return (
        <>
            <h1>Your Leave Balance</h1>
            <Table
                data={yourBalance}
                fields={fields}
                compact
                transparent
            />
        </>
    );
};

const YourLeaves = () => {
    const { user, refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { leaves, loading, fetchLeaves } = useLeaves();

    React.useEffect(() => {
        const refresh = refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh || !leaves) fetchLeaves({ user: user.id });
    }, [fetchLeaves, leaves, refreshTriggers, user.id]);

    return (
        <>
            <div className={'header'}>
                <h1>Your Leaves</h1>
                <Button
                    label={'New Leave'}
                    onClick={() => openDialog({content: 'leaveNew', style:{ width: 'calc(100% - 200px)'}})}
                />
            </div>
            <div className={'leaves-container app-scroll'}>
                {loading && <Loader/>}
                {!loading && leaves
                    ?.slice()
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                    .map(leave =>
                    <LeaveItem key={leave.id} leave={leave}/>)}
            </div>
        </>
    );
};

const ReporteeLeaves = ({requests}) => {
    const { user, refreshTriggers } = useApp();
    const { openDialog, openPopUp, closeTopModal } = useNav();
    const { leaves, loading, fetchLeaves, saveLeave } = useLeaves();

    React.useEffect(() => {
        if (!user.id) return;
        const refresh = refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh || !leaves) fetchLeaves({ user_scope: 'manager', user_scope_id: user.id }).then();
    }, [fetchLeaves, leaves, refreshTriggers, user.id]);

    const handleApproval = useCallback((id, status, action = 'accept') => {
        openPopUp({
            content: 'confirm',
            message: `Are you sure you want to ${action} this Leave request?`,
            onConfirm: async () => {
                const success = await saveLeave({id, data: {status}});
                if (!success) return;
                closeTopModal();
            },
        });
    }, [openPopUp, saveLeave, closeTopModal]);

    const fields = useMemo(() => ({
        0: {
            label: 'Leave',
            name: 'type',
            type: 'item',
            style: {cursor: 'pointer'},
            onClick: (data) => openDialog({content: 'leaveDetails', contentId: data.id, closeButton: false})
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
            type: 'item'
        },
        5: requests ? {
            label: 'Action',
            value: (data) => {
                if (data.status.id === 1 || data.status.id === 4)
                    return <div style={{display: 'flex', gap: '5px'}}>
                        <Button icon={'check_circle'} transparent label={'Approve'} onClick={ () => handleApproval(
                            data.id,
                            data.status.id === 1 ? 2 : data.status.id === 4 ? 5 : null, 'accept'
                        )} />
                        <Button icon={'cancel'} transparent label={'Reject'} onClick={ () => handleApproval(
                            data.id,
                            data.status.id === 1 ? 3 : data.status.id === 4 ? 2 : null, 'reject'
                        )} />
                    </div>
                else
                    return null;
            }
        } : null
    }), [requests, handleApproval, openDialog]);

    return (
        <>
            <h1>Your Reportees' Leaves</h1>
            <Table
                className={requests ? 'leave-requests-table' : 'leave-reportees-table'}
                data={leaves}
                fields={fields}
                dataPlaceholder={'No leave requests found.'}
                loading={loading}
                compact
                transparent
            />
        </>
    );

};

const LeavesIndex = () => {
    return (
        <>
            <section className={'your-leaves'}>
                <YourLeaves/>
            </section>
            <section className={'your-leave-balance'}>
                <YourBalance/>
            </section>
            <section className={'reportee-leaves'}>
                <ReporteeLeaves/>
            </section>
        </>
    );
};

export default LeavesIndex;