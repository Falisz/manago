// FRONTEND/components/Schedules/DateDetails.jsx
import React, {useCallback, useMemo, useRef} from 'react';
import {useHolidays, useHolidayWorkings, useWeekendWorkings} from "../../hooks/useResource";
import useApp from "../../contexts/AppContext";
import Button from "../Button";
import Table from "../Table";
import useNav from "../../contexts/NavContext";
import {formatDate} from "../../utils/dates";
import Loader from "../Loader";

const UsersWorkingAgreement = ({agreements, holiday, date}) => {
    const {openDialog} = useNav();
    const {saveHolidayWorking} = useHolidayWorkings();
    const {saveWeekendWorking} = useWeekendWorkings();

    const handleApproval = useCallback(async (id, status) => {
        if (holiday)
            await saveHolidayWorking({id, data: {status}});
        else if (date)
            await saveWeekendWorking({id, data: {status}});

    }, [date, holiday, saveWeekendWorking, saveHolidayWorking]);

    if (!agreements.length)
        return <i>Currently there are no Users working on this day.</i>;

    const fields = {
        0: {
            label: 'User',
            name: 'user',
            type: 'item',
            openModal: 'userDetails',
            style: {padding: '5px'}
        },
        1: {
            label: 'Status',
            name: 'status',
            value: (data) => {

                const { status, approver } = data;
                let date;

                if (status.id === 1)
                    date = data['date_requested'];

                if (status.id === 2)
                    date = data['date_approved'];

                if (status.id === 3)
                    date = data['date_rejected'];

                if (status.id === 4)
                    date = data['date_to_be_cancelled'];

                if (status.id === 5)
                    date = data['date_cancelled'];

                if (date)
                    date = formatDate(new Date(date));

                const prefix = [1, 4].includes(status.id) ? 'from' : 'on';

                return `${status?.name}
                            ${approver && ![1, 4].includes(status.id) ?  ` by ${approver.first_name} ${approver.last_name} ` : ''}
                            ${date ? ` ${prefix} ${date}` : ''}`
            },
            style: {padding: '5px'},
            onClick: (data) => openDialog({content: holiday ? 'holidayWorking' : 'weekendWorking', contentId: data.id, closeButton: false}),
        },
        3: {
            label: 'Actions',
            name: 'status',
            style: {padding: '5px'},
            value: (data) => {
                const status = data.status.id;

                if (status !== 1 && status !== 4)
                    return null;

                return (
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                        <Button
                            label={'Accept'}
                            icon={'check_circle'}
                            transparent={true}
                            style={{padding: 0, gap: 0}}
                            onClick={() => handleApproval(data.id, status === 1 ? 2 : 5)}
                        />
                        <Button
                            label={'Reject'}
                            icon={'cancel'}
                            transparent={true}
                            style={{padding: 0, gap: 0}}
                            onClick={() => handleApproval(data.id, status === 1 ? 3 : 2)}
                        />
                    </div>
                );
            }
        }
    };

    return <Table
        fields={fields}
        data={agreements}
        compact
        transparent
        wide
    />;
}

const DateDetails = ({date, modal}) => {
    const {user, refreshTriggers} = useApp();
    const {closeModal, openPopUp, openDialog} = useNav();
    const {holiday, fetchHoliday} = useHolidays();
    const {holidayWorkings, loading: hwLoading, fetchHolidayWorkings, saveHolidayWorking, deleteHolidayWorking}
        = useHolidayWorkings();
    const {weekendWorkings, loading: wwLoading, fetchWeekendWorkings,saveWeekendWorking, deleteWeekendWorking}
        = useWeekendWorkings();
    const loading = useMemo(() => hwLoading || wwLoading, [hwLoading, wwLoading]);
    const isMounted = useRef(false);
    const isWeekend = useRef(false);

    React.useEffect(() => {
        const refresh = refreshTriggers['holidayWorkings'] || refreshTriggers['weekendWorkings'];

        if (isMounted.current && !refresh) return;

        if (refresh) delete refreshTriggers['holidayWorkings'];
        if (refresh) delete refreshTriggers['weekendWorkings'];

        isWeekend.current = [0,6].includes(new Date(date).getDay());
        if (isWeekend.current)
            fetchWeekendWorkings({date}).then();

        fetchHoliday({date}).then();

        isMounted.current = true;
    }, [date, fetchHoliday, refreshTriggers, holiday, fetchWeekendWorkings]);

    React.useEffect(() => {
        if (holiday)
            fetchHolidayWorkings({holiday: holiday.id}).then();

    }, [holiday, fetchHolidayWorkings])

    const agreement = useMemo(() => {
        if (holiday)
            return holidayWorkings?.find(hw => hw.user.id === user.id);

        if (isWeekend.current)
            return weekendWorkings?.find(ww => ww.user.id === user.id);

        return null;
    }, [holiday, holidayWorkings, weekendWorkings, user.id]);

    const handleWorkingAgreement = useCallback((action) => {

        if (!action)
            return null;

        let message;
        let onConfirm;

        if (action === 'request') {
            message = `Are you sure you want to request for working day on ${holiday ? holiday.date : date}?`;
            onConfirm = async (note) => {
                if (holiday)
                    await saveHolidayWorking({data: {holiday: holiday.id, status: 1, user_note: note}});
                else if (date)
                    await saveWeekendWorking({data: {date: date, status: 1, user_note: note}});
            }
        }

        if (action === 'cancel') {
            message = `Are you sure you want to request for working day cancellation on ${holiday ? holiday.date : date}?`;
            onConfirm = async (note) => {
                if (holiday)
                    await saveHolidayWorking({id: agreement.id, data: {status: 4}, user_note: note});
                else if (date)
                    await saveWeekendWorking({id: agreement.id, data: {status: 4}, user_note: note});
            };
        }

        if (action === 'discard') {
            message = `Are you sure you want to discard the request for working day on ${holiday ? holiday.date : date}?`;
            onConfirm = async () => {
                if (holiday)
                    await deleteHolidayWorking({id: agreement.id});
                else if (date)
                    await deleteWeekendWorking({id: agreement.id});
            };

        }

        openPopUp({content: 'confirm', input: action !== 'discard', message, onConfirm});

    }, [agreement, saveHolidayWorking, saveWeekendWorking, deleteHolidayWorking, deleteWeekendWorking,
        openPopUp, date, holiday]);

    const status = useMemo(() => {
        if ((isWeekend.current || holiday) && (!agreement || [1,3,5].includes(agreement?.status?.id)))
            return 'You have a day off on this day. 😀';

        return 'You are scheduled to work on this day.'
    }, [agreement, holiday]);

    const agreementStatus = useMemo(() => {
        if (!agreement)
            return null;

        const { status, approver } = agreement;
        let date;

        if (status) {
            if (status.id === 1)
                date = agreement['date_requested'];

            if (status.id === 2)
                date = agreement['date_approved'];

            if (status.id === 3)
                date = agreement['date_rejected'];

            if (status.id === 4)
                date = agreement['date_to_be_cancelled'];

            if (status.id === 5)
                date = agreement['date_cancelled'];
        }

        if (date)
            date = formatDate(new Date(date));

        const prefix = [1, 4].includes(status?.id) ? 'from' : 'on';

        return `Working on this day is ${status?.name}
        ${approver && ![1, 4].includes(status.id) ? ` by ${approver.first_name} ${approver.last_name}` : ''}
        ${date ? ` ${prefix} ${date}` : ''}`;
    }, [agreement]);

    if (!date)
        return null;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div
            className={'details-page'}
        >
            <div className={'details-header'}>
                <div className={'details-title'}>
                    {dayName[new Date(date).getDay()] + (holiday?.name ? ` | ${holiday.name}` : '')}
                </div>
                <div className={'header-buttons'}>
                    {(isWeekend.current || holiday) && !agreement &&
                        <Button
                            transparent={true}
                            icon={'upload'}
                            label={'Request Working Day'}
                            onClick={() => handleWorkingAgreement('request')}
                        />
                    }
                    {(isWeekend.current || holiday) && agreement?.status?.id === 1 &&
                        <Button
                            transparent={true}
                            icon={'delete'}
                            label={'Discard Working Day Request'}
                            onClick={() => handleWorkingAgreement('discard')}
                        />
                    }
                    {(isWeekend.current || holiday) && agreement?.status?.id === 2 &&
                        <Button
                            transparent={true}
                            icon={'cancel'}
                            label={'Cancel Working Day'}
                            onClick={() => handleWorkingAgreement('cancel')}
                        />
                    }
                    <Button transparent={true} icon={'close'} label={'Close'} onClick={() => closeModal(modal)}/>
                </div>
            </div>
            <div className={'details-subtitle'}>{date}</div>
            {loading && <Loader/>}
            {!loading && (holidayWorkings || weekendWorkings) &&
                <div className={'details-content app-scroll'}>
                    <div className={'details-section'}>
                        <div className='section-header'>Your Working Status</div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {status}
                            {agreement && <span className={'working-agreement app-clickable'} onClick={agreement ? () => {
                                openDialog({content: holiday ? 'holidayWorking' : 'weekendWorking', contentId: agreement?.id, closeButton: false});
                            } : null}>
                                {agreementStatus}
                            </span>}
                        </div>
                    </div>
                    <div className={'details-section'}>
                        <div className='section-header'>Employees Working Status</div>
                        <UsersWorkingAgreement
                            agreements={holidayWorkings ?
                                holidayWorkings?.filter(hw => hw.user?.id !== user.id) :
                                weekendWorkings?.filter(ww => ww.user?.id !== user.id)
                            }
                            holiday={holiday}
                            date={date}
                        />
                    </div>
                </div>
            }
        </div>
    );
};

export default DateDetails;