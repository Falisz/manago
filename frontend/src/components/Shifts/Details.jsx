// FRONTEND/components/Shifts/Details.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useShifts} from '../../hooks/useResource';
import Details from '../Details';
import Loader from '../Loader';

const ShiftDetails = ({ shiftId, modal }) => {
    const { shift, loading, fetchShift, deleteShift } = useShifts();
    const { refreshData, refreshTriggers } = useApp();
    const { openModal, openDialog, closeModal, closeTopModal } = useNav();

    useEffect(() => {
        const refresh = refreshTriggers?.shift?.data === parseInt(shiftId);

        if (refresh)
            delete refreshTriggers.shift;

        if (shiftId && (!shift || refresh))
            fetchShift({id: shiftId, reload: refresh}).then();

    }, [fetchShift, shift, shiftId, refreshTriggers.shift]);

    const handleDelete = useCallback((users = 0) => {
        let message = 'Are you sure you want to delete this role? This action cannot be undone.'
        if (users > 0) {
            message += ` This role is currently assigned to ${users} user${users > 1 ? 's' : ''}.`
        }
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: message,
            onConfirm: async () => {
                const success = await deleteShift({id: shiftId});
                if (!success) return;
                refreshData('roles', true);
                closeTopModal();
            },
        });
    }, [shiftId, openModal, deleteShift, refreshData, closeTopModal]);

    const header = useMemo(() => ({
        title: 'Shift Details',
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                title: 'Edit User',
                onClick: () => {
                    closeModal(modal);
                    openDialog({content: 'shiftEdit', contentId: shiftId});
                }
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                title: 'Delete Shift',
                onClick: handleDelete
            }
        }
    }), [shiftId, modal, openDialog, closeModal, handleDelete]);

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
                    label: 'Date',
                    dataField: 'date',
                },
                1: {
                    label: 'Start Time',
                    dataField: 'start_time',
                    format: (val) => val.slice(0,5)
                },
                2: {
                    label: 'End Time',
                    dataField: 'end_time',
                    format: (val) => val.slice(0,5)
                }
            }
        },
        2: {
            style: { 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                gap: '15px'
            },
            fields: {
                0: {
                    label: 'Job Post',
                    dataType: 'item',
                    dataField: 'job_post',
                    item: {
                        idField: 'id',
                        dataField: 'name',
                        onClick: (id) => openDialog({content: 'jobPostDetails', contentId: id}),
                        style:  {
                            padding: '3px 5px',
                            borderRadius: '6px',
                            background: shift?.job_post ? shift.job_post.color : null 
                        } 
                    }
                },
                1: {
                    label: 'Location',
                    dataType: 'item',
                    dataField: 'job_location',
                    item: {
                        idField: 'id',
                        dataField: 'name',
                        onClick: (id) => openDialog({content: 'jobLocationDetails', contentId: id}),
                        style:  {
                            padding: '3px 5px',
                            borderRadius: '6px',
                            background: shift?.job_location ? shift.job_location.color : null 
                        } 
                    }
                }
            }
        },
        3: {
            fields: {
                0: {
                    dataField: 'schedule',
                    style: {
                        padding: '10px',
                        background: 'var(--seethrough-background-2)',
                        borderRadius: 'var(--def-border-radius)',
                        marginTop: '15px',
                        maxWidth: 500
                    },
                    format: (val) => val && <div>
                        This Shift is only planned on a Schedule Draft <i>{val.name.toString()}</i>.
                    </div>,
                    hideEmpty: true
                }
            }
        }
    }), [shift, openDialog]);

    if (loading)
        return <Loader/>;

    if (!shift)
        return <h1>Shift not found!</h1>;

    return <Details header={header} sections={sections} data={shift} />;
};

export default ShiftDetails;