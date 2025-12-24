// FRONTEND/components/Holidays/Details.js
import React from 'react';
import useApp from '../../contexts/AppContext';
import useNav from '../../contexts/NavContext';
import {useHolidays} from '../../hooks/useResource';
import Details from "../Details";

const HolidayDetails = ({ id, modal }) => {
    const { refreshTriggers, refreshData } = useApp();
    const { openPopUp, openDialog, closeTopModal } = useNav();
    const { holiday, loading, fetchHoliday, deleteHoliday } = useHolidays();

    React.useEffect(() => {
        const reload = refreshTriggers.holidays;
        if (reload) delete refreshTriggers.holidays;
        if (id && (!holiday || reload)) fetchHoliday({id, reload}).then();
    }, [fetchHoliday, holiday, id, refreshTriggers.holidays]);

    const handleDelete = React.useCallback(() => {
        let message = 'Are you sure you want to delete this Holiday? If there are any Agreements to work on this' +
            ' Holiday day, they will be deleted too. This action cannot be undone.';

        openPopUp({
            content: 'confirm',
            message: message,
            onConfirm: async () => {
                const success = await deleteHoliday({id});
                if (!success) return;
                refreshData('holidays', true);
                closeTopModal();
            },
        });
    }, [id, openPopUp, deleteHoliday, refreshData, closeTopModal]);

    const header = React.useMemo(() => ({
        title: {
            dataField: 'name',
        },
        subtitle: {
            hash: true,
            dataField: 'id',
            title: 'Holiday ID',
        },
        buttons: {
            edit: {
                className: 'edit',
                icon: 'edit',
                label: 'Edit',
                onClick: () => openDialog({content: 'holidayEdit', contentId: id})
            },
            delete: {
                className: 'delete',
                icon: 'delete',
                label: 'Delete',
                onClick: handleDelete
            }
        }
    }), [openDialog, id, handleDelete]);

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
                    label: 'Date',
                    dataType: 'string',
                    dataField: 'date'
                }
            }
        }
    }), []);

    return <Details
        header={header}
        sections={sections}
        data={holiday}
        modal={modal}
        loading={loading}
        placeholder={'Holiday not found!'}
    />;


};

export default HolidayDetails;