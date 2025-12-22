// FRONTEND/components/Approvals/Index.jsx
import React, {useCallback, useMemo, useRef} from 'react';
import useApp from "../../contexts/AppContext";
import useNav from "../../contexts/NavContext";
import {useLeaves} from "../../hooks/useResource";
import Button from "../Button";
import Table from "../Table";

const Approvals = ({pending}) => {

    const { user, refreshTriggers } = useApp();
    const { openDialog, openPopUp, closeTopModal } = useNav();
    const { leaves, loading, fetchLeaves, saveLeave } = useLeaves();
    const isMounted = useRef(true);

    React.useEffect(() => {
        if (!user.id) return;

        const refresh = refreshTriggers?.leaves || refreshTriggers?.aleave || false;

        if (!refresh || isMounted.current) return;

        if (refresh) delete refreshTriggers.leaves;
        if (refresh) delete refreshTriggers.aleave;

        if (refresh || !leaves) fetchLeaves({ user_scope: 'manager', user_scope_id: user.id }).then();

    }, [fetchLeaves, leaves, refreshTriggers, user.id]);

    React.useEffect(() => {
        if (!user.id) return;
        const refresh = refreshTriggers?.leaves || refreshTriggers?.aleave || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh) delete refreshTriggers.aleave;
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
            label: 'Type',
            name: 'type',
            type: 'item',
            style: {cursor: 'pointer'},
            onClick: (data) => openDialog({content: data.modalType, contentId: data.id, closeButton: false})
        },
        1: {
            label: 'User',
            name: 'user',
            type: 'item',
            openModal: 'userDetails'
        },
        2: {
            label: 'Date',
            name: 'date',
            type: 'string',
        },
        4: {
            label: 'Status',
            name: 'status',
            type: 'item'
        },
        5: pending ? {
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
    }), [pending, handleApproval, openDialog]);

    return (
        <Table
            className={pending ? 'leave-requests-table' : 'leave-reportees-table'}
            data={leaves?.filter(leave =>
                pending ? [1, 4].includes(leave.status.id) : [2, 3, 5].includes(leave.status.id))}
            fields={fields}
            dataPlaceholder={'No leave requests found.'}
            loading={loading}
        />
    );
}

const PendingApprovals = () => {
    return (
        <div className={'page-section'}>
            <div className={'page-section-header'}>
                <h1>Pending Approvals</h1>
            </div>
            <div className={'page-section-content app-scroll'}>
                <Approvals pending/>
            </div>
        </div>
    );
};

const ProcessedApprovals = () => {

  return (
      <div className={'page-section'}>
          <div className={'page-section-header'}>
              <h1>Processed Approvals</h1>
          </div>
          <div className={'page-section-content app-scroll'}>
              <Approvals/>
          </div>
      </div>
  );
};

const ApprovalsIndex = () => {
    return (
        <div className={'approvals-index'}>
            <PendingApprovals />
            <ProcessedApprovals />
        </div>
    );
};

export default ApprovalsIndex;