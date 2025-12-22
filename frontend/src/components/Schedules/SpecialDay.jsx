// FRONTEND/components/Schedules/SpecialDay.jsx
import React, {useCallback, useMemo, useRef} from 'react';
import Details from "../Details";
import {useHolidays, useHolidayWorkings, useWeekendWorkings} from "../../hooks/useResource";
import useApp from "../../contexts/AppContext";
import Button from "../Button";
import Table from "../Table";
import useNav from "../../contexts/NavContext";
import {formatDate} from "../../utils/dates";

const YourWorkingAgreement = ({agreement, holiday, date}) => {

    const {openPopUp} = useNav();
    const {saveHolidayWorking, deleteHolidayWorking} = useHolidayWorkings();
    const {saveWeekendWorking, deleteWeekendWorking} = useWeekendWorkings();

    const handleWorkingAgreement = useCallback((action) => {

        if (!action)
            return null;

        let message;
        let onConfirm;

        if (action === 'request') {
            message = `Are you sure you want to request for working day on ${holiday ? holiday.date : date}?`;
            onConfirm = async () => {
                if (holiday)
                    await saveHolidayWorking({data: {holiday: holiday.id, status: 1}});
                else if (date)
                    await saveWeekendWorking({data: {date: date, status: 1}});
            }
        }

        if (action === 'cancel') {
            message = `Are you sure you want to request for working day cancellation on ${holiday ? holiday.date : date}?`;
            onConfirm = async () => {
                if (holiday)
                    await saveHolidayWorking({id: agreement.id, data: {status: 4}});
                else if (date)
                    await saveWeekendWorking({id: agreement.id, data: {status: 4}});
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

        openPopUp({content: 'confirm', message, onConfirm});

    }, [agreement, saveHolidayWorking, saveWeekendWorking, deleteHolidayWorking, deleteWeekendWorking,
        openPopUp, date, holiday]);

    const status = useMemo(() => {

        if (!agreement)
            return 'This day is currently off for you. 😀';

        const { status, approver } = agreement;
        let date;

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

        if (date)
            date = formatDate(new Date(date));

        const prefix = [1, 4].includes(status?.id) ? 'from' : 'on';

        return `${status?.name}
        ${approver && ![1, 4].includes(status.id) ? ` by ${approver.first_name} ${approver.last_name}` : ''}
        ${date ? ` ${prefix} ${date}` : ''}`;
    }, [agreement]);


    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {status}
            {(!agreement || [3, 5].includes(agreement?.status?.id)) && <Button
                label={'Request working day'}
                onClick={() => handleWorkingAgreement('request')}
            />}
            {agreement && agreement.status?.id === 1 && <Button
                label={'Cancel Request'}
                onClick={() => handleWorkingAgreement('discard')}
            />}
            {agreement && agreement.status?.id === 2 && <Button
                label={'Request Cancellation'}
                onClick={() => handleWorkingAgreement('cancel')}
            />}
        </div>
    );
}

const UsersWorkingAgreement = ({agreements, holiday, date}) => {
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
            style: {padding: '5px'}
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
        style={{width:'90%', padding: 0}}
    />;
}

const SpecialDay = ({holidayId, date, modal}) => {

    const {user, refreshTriggers} = useApp();
    const {holiday, fetchHoliday} = useHolidays();
    const {holidayWorkings, loading: hwLoading, fetchHolidayWorkings} = useHolidayWorkings();
    const {weekendWorkings, loading: wwLoading, fetchWeekendWorkings} = useWeekendWorkings();
    const loading = useMemo(() => hwLoading || wwLoading, [hwLoading, wwLoading]);
    const isMounted = useRef(false);

    React.useEffect(() => {
        const refresh = refreshTriggers['holidayWorkings'] || refreshTriggers['weekendWorkings'];

        if (isMounted.current && !refresh) return;
        if (refresh) delete refreshTriggers['holidayWorkings'];
        if (refresh) delete refreshTriggers['weekendWorkings'];

        if (holidayId) {
            fetchHolidayWorkings({holiday: holidayId}).then();
            fetchHoliday({id: holidayId}).then();
        } else if (date) {
            fetchWeekendWorkings({date}).then();
        }
        isMounted.current = true;
    }, [holidayId, fetchHolidayWorkings, refreshTriggers, fetchHoliday, date, holiday, fetchWeekendWorkings]);

    const header = useMemo(() => {

        const suffix = holiday?.date || date || null;

        const dayName = (dateStr) => {
            const day = new Date(dateStr).getDay();
            return day === 0 ? 'Sunday' : day === 6 ? 'Saturday' : null;
        }

        const title = holiday?.name || dayName(suffix) || null

        return { title, suffix }
    }, [holiday, date]);

    const sections = useMemo(() => ({
        0: {
            fields: {
                0: {
                    label: "Your Working Status",
                    dataField: 'you',
                },
                1: {
                    label: "Users' Working on that Day",
                    dataField: 'users'
                }
            }
        }
    }), []);

    const data = useMemo(() => {
        if (holidayWorkings || weekendWorkings)
            return {
                you: <YourWorkingAgreement
                        agreement={holidayWorkings ?
                            holidayWorkings.find(hw => hw.user?.id === user.id) :
                            weekendWorkings.find(ww => ww.user?.id === user.id)
                        }
                        holiday={holiday}
                        date={date}
                    />,
                users: <UsersWorkingAgreement
                        agreements={holidayWorkings ?
                            holidayWorkings.filter(hw => hw.user?.id !== user.id) :
                            weekendWorkings.filter(ww => ww.user?.id !== user.id)
                        }
                        holiday={holiday}
                        date={date}
                    />
            }

        return null;
    }, [holiday, user.id, holidayWorkings, date, weekendWorkings]);

    return (
        <Details
            header={header}
            sections={sections}
            data={data}
            modal={modal}
            loading={loading}
            placeholder={'Day not found!'}
        />
    );
};

export default SpecialDay;