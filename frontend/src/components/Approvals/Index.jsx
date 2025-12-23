// FRONTEND/components/Approvals/Index.jsx
import React, {useCallback, useMemo, useRef} from 'react';
import useApp from "../../contexts/AppContext";
import useNav from "../../contexts/NavContext";
import {useHolidayWorkings, useLeaves, useWeekendWorkings} from "../../hooks/useResource";
import Button from "../Button";
import Table from "../Table";

const Approvals = ({approvals, loading, pending}) => {
    const { openDialog, openPopUp } = useNav();
    const { saveLeave } = useLeaves();
    const { saveHolidayWorkings } = useHolidayWorkings();
    const { saveWeekendWorkings } = useWeekendWorkings();

    const handleApproval = useCallback((type, id, status, action = 'accept') => {
        openPopUp({
            content: 'confirm',
            message: `Are you sure you want to ${action} this ${type} request?`,
            input: true,
            onConfirm: async (note) => {
                if (type === 'Absence') await saveLeave({id, data: {status, approver_note: note}});
                if (type === 'Holiday Working') await saveHolidayWorkings({id, data: {status, approver_note: note}});
                if (type === 'Weekend Working') await saveWeekendWorkings({id, data: {status, approver_note: note}});
            },
        });
    }, [openPopUp, saveLeave, saveHolidayWorkings, saveWeekendWorkings]);



    const fields = useMemo(() => ({
        0: {
            label: 'Type',
            name: 'name',
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
                            data.type,
                            data.id,
                            data.status.id === 1 ? 2 : data.status.id === 4 ? 5 : null,
                            'accept'
                        )} />
                        <Button icon={'cancel'} transparent label={'Reject'} onClick={ () => handleApproval(
                            data.type,
                            data.id,
                            data.status.id === 1 ? 3 : data.status.id === 4 ? 2 : null,
                            'reject'
                        )} />
                    </div>
                else
                    return null;
            }
        } : null
    }), [pending, handleApproval, openDialog]);

    return (
        <Table
            data={approvals?.filter(apr =>
                pending ? [1, 4].includes(apr.status.id) : [2, 3, 5].includes(apr.status.id))}
            fields={fields}
            dataPlaceholder={`No ${pending ? 'Pending' : 'Processed'} Approvals found.`}
            loading={loading}
            compact transparent
        />
    );
}


const ApprovalsIndex = () => {
    const { user, refreshTriggers } = useApp();
    const { leaves, loading: leavesLoading, fetchLeaves } = useLeaves();
    const { holidayWorkings, loading: holidayWorkingLoading, fetchHolidayWorkings } = useHolidayWorkings();
    const { weekendWorkings, loading: weekendWorkingLoading, fetchWeekendWorkings } = useWeekendWorkings();
    const loading = useMemo(() => leavesLoading || holidayWorkingLoading || weekendWorkingLoading,
        [leavesLoading, holidayWorkingLoading, weekendWorkingLoading]);
    const isMounted = useRef(false);

    React.useEffect(() => {
        if (!user.id) return;

        const refreshLeaves = refreshTriggers?.leaves;
        const refreshHW = refreshTriggers?.holidayWorkings;
        const refreshWW = refreshTriggers?.weekendWorkings;

        if (isMounted.current && !(refreshLeaves || refreshHW || refreshWW)) return;

        if (refreshLeaves || !leaves) fetchLeaves({ user_scope: 'manager', user_scope_id: user.id, reload: true }).then();

        if (refreshHW || !weekendWorkings) fetchHolidayWorkings({ managed: user.id, reload: true }).then();

        if (refreshWW || !holidayWorkings) fetchWeekendWorkings({ managed: user.id, reload: true }).then();

        if (refreshLeaves) delete refreshTriggers.leaves;
        if (refreshHW) delete refreshTriggers.holidayWorkings;
        if (refreshWW) delete refreshTriggers.weekendWorkings;

        isMounted.current = true;

    }, [fetchLeaves, leaves, fetchHolidayWorkings, holidayWorkings, fetchWeekendWorkings, weekendWorkings,
        refreshTriggers, user.id]);

    const approvals = useMemo(() => {
        if (!leaves || !weekendWorkings || !holidayWorkings)
            return [];

        const getDay = (str) => {
            const date = new Date(str);
            const day = date.getDay();
            return day === 0 ? 'Sunday' : 'Saturday';
        };

        const result = [
            ...leaves.map(l => ({
                id: l.id,
                type: 'Absence',
                name: l.type?.name || 'Leave',
                modalType: 'leaveDetails',
                type_color: l.type?.color,
                status: l.status,
                user: l.user,
                date: l.start_date,
                end_date: l.end_date
            })),
            ...holidayWorkings.map(hw => ({
                id: hw.id,
                type: 'Holiday Working',
                name: (hw.holiday?.name || 'Holiday') + ' Working',
                modalType: 'holidayWorking',
                status: hw.status,
                user: hw.user,
                date: hw.holiday?.date,
            })),
            ...weekendWorkings.map(ww => ({
                id: ww.id,
                type: 'Weekend Working',
                name: getDay(ww.date) + ' Working',
                modalType: 'weekendWorking',
                status: ww.status,
                user: ww.user,
                date: ww.date,
            }))
        ];

        return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [leaves, weekendWorkings, holidayWorkings]);

    return (
        <>
            <section>
                <h1>Pending Approvals</h1>
                <Approvals approvals={approvals} loading={loading} pending />
            </section>
            <section>
                <h1>Processed Approvals</h1>
                <Approvals approvals={approvals} loading={loading} />
            </section>
        </>
    );
};

export default ApprovalsIndex;