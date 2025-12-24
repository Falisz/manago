// FRONTEND/components/LeaveType/Details.js
import React from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useLeaveTypes} from '../../hooks/useResource';
import Details from "../Details";

const LeaveTypeDetails = ({ id, modal }) => {
    const { refreshTriggers, refreshData } = useApp();
    const { openPopUp, openModal, closeTopModal } = useNav();
    const { leaveType, loading, fetchLeaveType, deleteLeaveType } = useLeaveTypes();

    React.useEffect(() => {
        const reload = refreshTriggers.leaveTypes;
        if (reload) delete refreshTriggers.leaveTypes;
        if (id && (!leaveType || reload)) fetchLeaveType({id, reload}).then();
    }, [fetchLeaveType, leaveType, id, refreshTriggers.leaveTypes]);

    const handleDelete = React.useCallback(() => {
        let message = 'Are you sure you want to delete this Leave Type? If there are any Leaves of this type' +
            ' they will be left typeless. This action cannot be undone.';

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteLeaveType({id});
                if (!success) return;
                refreshData('holidays', true);
                closeTopModal();
            },
        });
    }, [id, openPopUp, deleteLeaveType, refreshData, closeTopModal]);

    const header = React.useMemo(() => ({
        style: { borderColor: leaveType?.color },
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Leave Type ID',
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openModal({content: 'leaveTypeEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [leaveType, openModal, id, handleDelete]);

    const sections = React.useMemo(() => ({
        0: {
            style: { flexDirection: 'row', gap: '20px' },
            fields: {
                0: {
                    label: 'Name',
                    dataType: 'string',
                    dataField: 'name'
                },
                1: {
                    label: 'Abbreviated Name',
                    dataType: 'string',
                    dataField: 'abbreviation'
                },
                2: {
                    label: 'Color',
                    dataType: 'string',
                    dataField: 'color'
                },
                3: {
                    label: 'Can be Planned',
                    dataType: 'boolean',
                    dataField: 'plannable',
                    trueValue: 'This type of Absence can be planned.',
                    trueIcon: 'check',
                    falseValue: 'This type of Absence cannot be planned.',
                    falseIcon: 'close',
                }
            }
        }
    }), []);

    return <Details
        header={header}
        sections={sections}
        data={leaveType}
        modal={modal}
        loading={loading}
        placeholder={'Holiday not found!'}
    />;
};

export default LeaveTypeDetails;