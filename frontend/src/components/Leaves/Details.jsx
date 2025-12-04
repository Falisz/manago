// FRONTEND/components/Roles/Leaves.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useLeaves, useRequestStatuses} from '../../hooks/useResource';
import Details from '../Details';

const LeaveDetails = ({ id, modal }) => {
    const { refreshTriggers, user } = useApp();
    const { openPopUp, openDialog, closeTopModal } = useNav();
    const { leave, loading, fetchLeave, saveLeave, deleteLeave } = useLeaves();
    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();

    useEffect(() => { fetchRequestStatuses(); }, [fetchRequestStatuses]);

    useEffect(() => {
        const reload = refreshTriggers?.leave?.data === parseInt(id);
        if (reload) delete refreshTriggers.leave;
        if (id && (!leave || reload)) fetchLeave({id, reload}).then();
    }, [fetchLeave, leave, id, refreshTriggers.leave]);

    const handleCancel = useCallback(() => {

        const discard = leave.status === 0 || leave.status === 1;
        const message = discard ?
            'Are you sure you want to delete this Planned Leave? This action cannot be undone.' :
            'Are you sure you want to request for cancellation of this Leave?';

        openPopUp({
            content: 'confirm',
            message,
            onConfirm: async () => {
                const success = discard ?
                    await deleteLeave({id}) :
                    await saveLeave({id, data: {status: 4}});
                if (!success) return;
                closeTopModal();
            },
        });
    }, [id, leave, openPopUp, saveLeave, deleteLeave, closeTopModal]);

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

    const buttons = useMemo(() => {

        const yours = leave?.user?.id === user.id;
        const managed = user?.managed_users?.find(user => leave?.user?.id === user.id);
        const planned = leave?.status === 0
        const requested = leave?.status === 1;
        const approved = leave?.status === 2;
        const rejected = leave?.status === 3;

        return {
            delete: yours && (planned || requested) && {
                className: 'delete',
                icon: 'delete',
                label: 'Discard',
                onClick: handleCancel
            },
            accept: managed && (requested || rejected) && {
                className: 'accept',
                icon: 'check_circle',
                label: rejected ? 'Re-Approve' : 'Accept',
                onClick: () =>
                    handleApproval(leave.id, [1,3].includes(leave.status) ? 2 : leave.status === 4 ? 5 : null, 'approve')
            },
            reject: managed && requested && {
                className: 'reject',
                icon: 'cancel',
                label: 'Reject',
                onClick: () =>
                    handleApproval(leave.id, leave.status === 1 ? 3 : leave.status === 4 ? 2 : null, 'reject')
            },
            cancel: yours && approved && {
                className: 'cancel',
                icon: 'cancel',
                label: 'Request',
                onClick: handleCancel
            }
        };

    }, [leave, user, handleApproval, handleCancel]);

    const header = useMemo(() => ({
        style: { borderBottom: '2px solid ' + (leave?.color || 'var(--text-color-3)') },
        title: (user.id === leave?.user?.id ? 'Your ' : '') + leave?.type,
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Leave ID',
        },
        buttons
    }), [user.id, leave, buttons]);

    const sections = useMemo(() => ({
        0: user.id !== parseInt(leave?.user?.id) ? {
            fields: {
                0: {
                    label: 'User',
                    dataType: 'item',
                    dataField: 'user',
                    item: {
                        idField: 'id',
                        dataField: ['first_name', 'last_name'],
                        onClick: (id) => openDialog({content: 'userDetails', contentId: id, closeButton: false})
                    }
                }
            }
        } : null,
        1: {
            style: { 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                gap: '15px'
            },
            fields: {
                0: {
                    label: 'Start Date',
                    dataField: 'start_date',
                },
                1: {
                    label: 'End Date',
                    dataField: 'end_date'
                }
            }
        },
        2: {
            fields: {
                0: {
                    label: 'Status',
                    dataField: 'status',
                    format: () => requestStatuses?.find(status => status.id === leave?.status)?.name
                }
            }
        }
    }), [openDialog, requestStatuses, user.id, leave]);

    return <Details
        header={header}
        sections={sections}
        data={leave}
        modal={modal}
        loading={loading}
        placeholder={'Leave not found!'}
    />;
};

export default LeaveDetails;