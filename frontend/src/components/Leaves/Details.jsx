// FRONTEND/components/Roles/Leaves.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useLeaves, useRequestStatuses} from '../../hooks/useResource';
import Details from '../Details';
import Loader from '../Loader';

const LeaveDetails = ({ id }) => {
    const { refreshData, refreshTriggers, user } = useApp();
    const { openModal, openDialog, closeTopModal } = useNav();
    const { leave, loading, fetchLeave, deleteLeave } = useLeaves();
    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();

    console.log(user);

    useEffect(() => {
        fetchRequestStatuses()
    }, [fetchRequestStatuses]);

    useEffect(() => {
        const reload = refreshTriggers?.leave?.data === parseInt(id);
        if (reload) delete refreshTriggers.leave;
        if (id && (!leave || reload)) fetchLeave({id, reload}).then();
    }, [fetchLeave, leave, id, refreshTriggers.leave]);

    const handleDiscard = useCallback(() => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to discard this leave? This action cannot be undone.',
            onConfirm: async () => {
                const success = await deleteLeave({id});
                if (!success) return;
                refreshData('roles', true);
                closeTopModal();
            },
        });
    }, [id, openModal, deleteLeave, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        prefix: {
            dataField: 'id',
            title: 'Role ID',
        },
        title: 'Leave',
        buttons: {
            delete: leave?.status === ( 0 || 1) &&  {
                className: 'delete',
                icon: 'delete',
                title: 'Delete User',
                onClick: handleDiscard
            }
        }
    }), [leave, handleDiscard]);

    const sections = useMemo(() => ({
        0: {
            fields: {
                0: {
                    label: 'User',
                    dataType: 'item',
                    dataField: 'user',
                    item: {
                        idField: 'id',
                        dataField: ['first_name', 'last_name'],
                        onClick: (id) => openDialog({content: 'userDetails', contentId: id})
                    }
                }
            }
        },
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
    }), [openDialog, requestStatuses, leave?.status]);

    if (loading)
        return <Loader />;

    if (!leave)
        return <h1>Leave not found!</h1>;

    return <Details header={header} sections={sections} data={leave} />;
};

export default LeaveDetails;