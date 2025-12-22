import {useHolidayWorkings, useWeekendWorkings} from "../../hooks/useResource";
import Details from "../Details";
import React, {useCallback, useMemo} from "react";
import useApp from "../../contexts/AppContext";
import useNav from "../../contexts/NavContext";


const SpecialWorkingDetails = ({id, holiday, weekend, modal}) => {

    const { refreshTriggers, user } = useApp();
    const { openPopUp, openDialog } = useNav();
    const { holidayWorking, fetchHolidayWorking, loading: hhLoading, saveHolidayWorking, deleteHolidayWorking }
        = useHolidayWorkings();
    const { weekendWorking, fetchWeekendWorking, loading: hwLoading, saveWeekendWorking, deleteWeekendWorking }
        = useWeekendWorkings();

    React.useEffect(() => {
        if (holiday) {
            const reload = !!refreshTriggers['holidayWorkings']?.data;
            if (reload) delete refreshTriggers['holidayWorkings'];
            if (id && (!holidayWorking || reload)) fetchHolidayWorking({id, reload}).then();
        }
        if (weekend) {
            const reload = !!refreshTriggers['weekendWorkings']?.data;
            if (reload) delete refreshTriggers['weekendWorkings'];
            if (id && (!weekendWorking || reload)) fetchWeekendWorking({id, reload}).then();
        }
    }, [id, holiday, refreshTriggers, holidayWorking, fetchHolidayWorking, weekend, weekendWorking, fetchWeekendWorking]);

    const agreement = useMemo(() => holiday ? holidayWorking : weekendWorking,
        [holiday, holidayWorking, weekendWorking]);

    const handleCancel = useCallback(() => {
        const discard = agreement.status === 0 || agreement.status === 1;
        const message = discard ?
            `Are you sure you want to delete this ${holiday ? 'Holiday' : 'Weekend'} Working Agreement? This action cannot be undone.` :
            `Are you sure you want to request for cancellation of this ${holiday ? 'Holiday' : 'Weekend'} Working Agreement?`;
        const onConfirm = async () => {
            if (holiday) {
                if (discard) await deleteHolidayWorking({id});
                else await saveHolidayWorking({id, data: {status: 4}});
            } else {
                if (discard) await deleteWeekendWorking({id});
                else await saveWeekendWorking({id, data: {status: 4}});
            }
        }
        openPopUp({content: 'confirm', message, onConfirm});
    }, [id, holiday, agreement, saveHolidayWorking, deleteHolidayWorking, saveWeekendWorking, deleteWeekendWorking,
        openPopUp]);

    const handleApproval = useCallback((id, status, action = 'accept') => {
        if (!id || !status)
            return;

        openPopUp({
            content: 'confirm',
            message: `Are you sure you want to ${action} this Leave request?`,
            onConfirm: async () => {
                if (holiday) await saveHolidayWorking({id, data: {status}});
                else await saveWeekendWorking({id, data: {status}});
            }
        });
    }, [holiday, openPopUp, saveHolidayWorking, saveWeekendWorking]);

    const buttons = useMemo(() => {
        if (!user || !agreement)
            return null;

        const yours = agreement.user.id === user.id;
        const managed = user.managed_users.find(user => agreement.user.id === user.id)
            || user.permissions.includes('*');
        const requested = agreement.status.id === 1;
        const approved = agreement.status.id === 2;
        const rejected = agreement.status.id === 3;
        const cancelRequested = agreement.status.id === 4;

        return {
            delete: yours && requested && {
                className: 'delete',
                icon: 'delete',
                label: 'Discard',
                onClick: handleCancel
            },
            accept: managed && (requested || rejected || cancelRequested) && {
                className: 'accept',
                icon: 'check_circle',
                label: rejected ? 'Re-Approve' : 'Accept',
                onClick: () =>
                    handleApproval(
                        agreement.id,
                        requested || rejected ? 2 : cancelRequested ? 5 : null,
                        'approve'
                    )
            },
            reject: managed && (requested || cancelRequested) && {
                className: 'reject',
                icon: 'cancel',
                label: 'Reject',
                onClick: () =>
                    handleApproval(
                        agreement.id,
                        requested ? 3 : cancelRequested ? 2 : null,
                        'reject'
                    )
            },
            cancel: yours && approved && {
                className: 'cancel',
                icon: 'cancel',
                label: 'Cancel',
                onClick: handleCancel
            }
        };

    }, [user, agreement, handleApproval, handleCancel]);

    const header = useMemo(() => ({
        title: (holiday ? 'Holiday' : 'Weekend') + ' Working Agreement',
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Working Agreement ID',
        },
        buttons
    }), [holiday, buttons]);


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
                        onClick: (id) => openDialog({content: 'userDetails', contentId: id, closeButton: false})
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
            fields: holiday ? {
                0: {
                    label: 'Holiday',
                    dataType: 'item',
                    dataField: 'holiday'
                },
            } : {
                0: {
                    label: 'Date',
                    dataField: 'date'
                },
            }
        },
        2: {
            fields: {
                0: {
                    label: 'Status',
                    dataField: 'status',
                    dataType: 'item'
                }
            }
        }
    }), [openDialog, holiday]);

    return <Details
        header={header}
        sections={sections}
        data={agreement}
        modal={modal}
        loading={hhLoading || hwLoading}
        placeholder={'Working Agreement not found!'}
    />;
}

export const HolidayWorking = ({id, modal}) => <SpecialWorkingDetails id={id} modal={modal} holiday />;
export const WeekendWorking = ({id, modal}) => <SpecialWorkingDetails id={id} modal={modal} weekend />;