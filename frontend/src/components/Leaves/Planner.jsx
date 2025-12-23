// FRONTEND/components/Leaves/Planner.jsx
import React from 'react';
import MonthGrid from "../MonthGrid";
import Button from "../Button";
import {generateDateList, formatDate} from "../../utils/dates";
import '../../styles/LeavesPlanner.css';
import {useLeaves, useLeaveTypes, useHolidays} from "../../hooks/useResource";
import useApp from "../../contexts/AppContext";
import EditForm from "../EditForm";
import useNav from "../../contexts/NavContext";

function LeavesPlanner( {modal} ) {
    const { user, refreshTriggers } = useApp();
    const { setDiscardWarning } = useNav();
    const { leaves, fetchLeaves, saveLeave, fetchLeaveBalance } = useLeaves();
    const { holidays, fetchHolidays } = useHolidays();
    const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
    const [ leaveBalance, setLeaveBalance ] = React.useState({});
    const [ newLeave, setNewLeave ] = React.useState({
        leave_type: null,
        start_date: null,
        end_date: null,
        status: 0
    });
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedDates, setSelectedDates] = React.useState(new Set());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, monthStr] = selectedMonth.split('-');
    const currentYear = React.useRef(parseInt(year));
    const month = parseInt(monthStr, 10);
    const currentMonth = `${year}-${month}`;
    const nextYear = month + 1 > 12 ? parseInt(year) + 1 : year;
    const nextMonth = String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0');

    React.useEffect(() => {
        fetchLeaveTypes().then();
        fetchLeaveBalance({year: new Date().getFullYear()}).then(res => setLeaveBalance(res));
        fetchHolidays().then();
    }, [fetchLeaveTypes, fetchLeaveBalance, fetchHolidays, setLeaveBalance]);

    React.useEffect(() => {
        const refresh = refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh || !leaves) fetchLeaves({ user: user.id });
    }, [fetchLeaves, leaves, refreshTriggers, user.id]);

    const holidayDates = React.useMemo(() => {
        const dates = new Set();
        holidays?.forEach(holiday => dates.add(holiday?.date));
        return dates;
    }, [holidays]);

    const currentLeavesDates = React.useMemo(() => {
        const dates = new Set();

        leaves?.forEach(leave => {
            if (leave.status.id === 3 || leave.status.id === 5)
                return;
            const { start_date, end_date } = leave;
            if (start_date && !end_date)
                dates.add(start_date);
            else if (start_date && end_date)
                generateDateList(start_date, end_date).forEach(date => dates.add(formatDate(date)));
        });

        return dates;

    }, [leaves]);

    const handleSelection = React.useCallback((date) => {

        if (date === null) {
            setNewLeave({...newLeave, start_date: null, end_date: null});
            setSelectedDates(new Set([]));
        }

        if (!newLeave.type || leaveBalance[newLeave.type]?.availableBalance === 0 || currentLeavesDates.has(date) ||
            (!newLeave.include_holidays && holidayDates.has(date)))
            return;

        if (!leaveTypes?.find(leave => leave.id === newLeave.type)?.multiple) {
            const {start_date} = newLeave;
            if (start_date === date) {
                setNewLeave({...newLeave, start_date: null});
                setSelectedDates(new Set([]));
            } else {
                setNewLeave({...newLeave, start_date: date});
                setSelectedDates(new Set([date]));
                const newYear = new Date(date).getFullYear()
                if (currentYear.current !== newYear) {
                    currentYear.current = newYear;
                    fetchLeaveBalance({year: newYear}).then(res => setLeaveBalance(res));
                }
            }
            return;
        }

        const {start_date, end_date} = newLeave;
        let dates;

        if (!start_date && !end_date) {
            setNewLeave({...newLeave, start_date: date});
            dates = [date];
            const newYear = new Date(date).getFullYear()
            if (currentYear.current !== newYear) {
                currentYear.current = newYear;
                fetchLeaveBalance({year: newYear}).then(res => setLeaveBalance(res));
            }
        } else if (start_date && !end_date) {
            if (new Date(start_date) < new Date(date)) {
                setNewLeave({...newLeave, end_date: date});
                dates = generateDateList(start_date, date, !newLeave.include_weekends).map(formatDate);
            } else {
                setNewLeave({...newLeave, start_date: date, end_date: start_date});
                dates = generateDateList(date, start_date, !newLeave.include_weekends).map(formatDate);
            }
        } else if (!start_date && end_date) {
            if (new Date(end_date) > new Date(date)) {
                setNewLeave({...newLeave, start_date: date});
                dates = generateDateList(date, end_date, !newLeave.include_weekends).map(formatDate);
            } else {
                setNewLeave({...newLeave, start_date: end_date, end_date: date});
                dates = generateDateList(end_date, date, !newLeave.include_weekends).map(formatDate);
            }
        } else if (start_date === end_date) {
            setNewLeave({...newLeave, start_date: null, end_date: null});
            dates = [];
        } else if (start_date && end_date) {
            setNewLeave({...newLeave, start_date: date, end_date: null});
            dates = [date];
        }

        dates = dates.filter(date => !currentLeavesDates.has(date));
        if (!newLeave.include_holidays)
            dates = dates.filter(date => !holidayDates.has(date));

        setSelectedDates(new Set([...dates]));

    },[newLeave, leaveTypes, leaveBalance, currentLeavesDates, holidayDates, fetchLeaveBalance]);

    const changeMonth = React.useCallback((val=0) => {

        const newYear = month + val > 12 ? parseInt(year) + 1 : month + val <= 0 ? parseInt(year) - 1 : year;
        const newMonth = String(month + val > 12 ? 1 : month + val <= 0 ? 12 : month + val).padStart(2, '0');

        setSelectedMonth(`${newYear}-${newMonth}`)
    }, [month, year]);

    const getBalance = React.useCallback((type) => {
        if (!type || !leaveBalance[type])
            return null;

        const balance = leaveBalance[type];
        const days = (n) => `${n} day${n !== 1 && 's'}`;
        const value = (label, field) => balance[field] != null && <><b>{label}:</b> {days(balance[field])} &nbsp;</>;

        return <span style={{padding: '5px'}}>
            {value('Availed Leaves', 'totalBalance')}
            {value('Used Leaves', 'usedBalance')}
            {value('Available Leaves', 'availableBalance')}
        </span>
    }, [ leaveBalance ])

    const sections = React.useMemo(() => ({
        0: {
            fields: {
                type: {
                    style: {flex: '1 0 100%'},
                    type: 'combobox',
                    label: 'Leave Type',
                    searchable: false,
                    required: true,
                    options: leaveTypes?.map(type => ({id: type.id, name: type.name})) || []
                },
                balance: {
                    type: 'content',
                    content: () => getBalance(newLeave.type)
                }
            }
        },
        1: {
            style: {flexWrap: 'nowrap'},
            fields: {
                start_date: {
                    type: 'date',
                    label: leaveTypes?.find(leave => leave.id === newLeave.type)?.multiple ? 'Start Date' : 'Date',
                    required: true,
                    min: `${new Date(newLeave.start_date).getFullYear()}-01-01`,
                    max: newLeave.end_date,
                    disabled: !newLeave.type || leaveBalance[newLeave.type]?.availableBalance === 0
                },
                end_date: leaveTypes?.find(leave => leave.id === newLeave.type)?.multiple && {
                    type: 'date',
                    label: 'End Date',
                    min: newLeave.start_date,
                    max: `${new Date(newLeave.start_date).getFullYear()}-12-31`,
                    disabled: !newLeave.start_date
                },
                days: {
                    type: 'content',
                    label: 'Days',
                    content: () => {
                        const days = selectedDates.size;
                        const available = leaveBalance[newLeave.type]?.availableBalance;
                        const overFlow = available != null && days > available;
                        const color = overFlow ? 'red' : 'var(--text-color)';
                        return <span style={{padding: '5px', color}}>{days} day{days !== 1 && 's'}</span>;
                    }
                }
            }
        },
        2: {
            fields: {
                include_weekends: {
                    type: 'checkbox',
                    label: 'Include Weekends',
                    inputLabel: 'Should Weekends be included?',
                    style: {alignItems: 'flex-start'}
                },
                include_holidays: {
                    type: 'checkbox',
                    label: 'Include Holidays',
                    inputLabel: 'Should Holidays be included?',
                    style: {alignItems: 'flex-start'}
                }
            }
        },
        3: {
            fields: {
                user_note: {
                    type: 'textarea',
                    label: 'Note',
                    placeholder: 'Optional note'
                }
            }
        }
    }), [newLeave, leaveTypes, leaveBalance, selectedDates, getBalance]);

    const handleChange = React.useCallback((target) => {
        const {name, value, checked} = target;

        if (name === 'type') {
            const multiple = leaveTypes?.find(leave => leave.id === value)?.multiple;
            if (!multiple) {
                setNewLeave({...newLeave, end_date: null});
                handleSelection(newLeave.start_date);
            }

        } else if (name === 'start_date' || name === 'end_date') {
            const {start_date, end_date} = newLeave;
            if ((start_date && end_date) || (start_date && name ==='end_date') || (start_date && name === 'end_date')) {
                let dates = [];
                if (name === 'start_date')
                    dates = generateDateList(value, end_date, !newLeave.include_weekends).map(formatDate);
                else if (name === 'end_date')
                    dates = generateDateList(start_date, value, !newLeave.include_weekends).map(formatDate);

                dates = dates.filter(date => !currentLeavesDates.has(date));
                if (!newLeave.include_holidays)
                    dates = dates.filter(date => !holidayDates.has(date));

                setSelectedDates(new Set([...dates]));
            } else {
                if (!currentLeavesDates.has(value)) {
                    if (!newLeave.include_holidays && holidayDates.has(value))
                        return;
                    setSelectedDates(new Set([value]));
                }
            }

            if (name === 'start_date') {
                const newYear = new Date(value).getFullYear()
                if (currentYear.current !== newYear) {
                    currentYear.current = newYear;
                    fetchLeaveBalance({year: newYear}).then(res => setLeaveBalance(res));
                }
            }

        } else if (name === 'include_weekends') {
            const {start_date, end_date} = newLeave;
            if (start_date && end_date) {
                let dates = generateDateList(start_date, end_date, !checked).map(formatDate);
                dates = dates.filter(date => !currentLeavesDates.has(date));
                if (!newLeave.include_holidays)
                    dates = dates.filter(date => !holidayDates.has(date));
                setSelectedDates(new Set([...dates]));
            }
        } else if (name === 'include_holidays') {
            const {start_date, end_date} = newLeave;
            if (start_date && end_date) {
                let dates = generateDateList(start_date, end_date, !newLeave.include_weekends).map(formatDate);
                dates = dates.filter(date => !currentLeavesDates.has(date));
                if (!checked)
                    dates = dates.filter(date => !holidayDates.has(date));
                setSelectedDates(new Set([...dates]));
            }
        }

        modal && setDiscardWarning(modal, true);
    }, [newLeave, leaveTypes, handleSelection, currentLeavesDates, holidayDates, modal, setDiscardWarning,
        fetchLeaveBalance]);

    const handleSubmit = React.useCallback(async (action) => {
        newLeave.days = selectedDates.size;
        const status = action === 'request' ? 1 : 0;
        return await saveLeave({data: {...newLeave, status}});
    }, [saveLeave, newLeave, selectedDates]);

    const leaveItems = React.useMemo(() => {
        const dates = {};
        leaves?.filter(leave => ![3,5].includes(leave.status.id)).forEach(leave => {
            leave.item_type='leave';
            const { start_date, end_date } = leave;
            if (start_date && end_date)
                generateDateList(start_date, end_date).map(formatDate).forEach(date => dates[date] = leave);
            else if (start_date)
                dates[start_date] = leave;
        });
        holidays?.forEach(holiday => {
            if (!holiday) return null;
            holiday.item_type='holiday';
            dates[holiday.date] = holiday
        });
        return dates;
    }, [leaves, holidays]);

    const disableSubmit = React.useMemo(() => {
        return (!newLeave.type || !newLeave.start_date
            || selectedDates.size > leaveBalance[newLeave.type]?.availableBalance);
    }, [newLeave, selectedDates, leaveBalance]);

    return (
        <div className={'leave-planner'}>
            <div className={'leave-planner-header'}>
                <h1>New Absence</h1>
            </div>
            <div className={'leave-planner-content'}>
                <div className={'leave-planner-date-picker'}>
                    <div className={'leave-planner-date-picker-notice'}>
                    </div>
                    <Button
                        className={'leave-planner-preview-nav back'}
                        icon={'arrow_back'}
                        onClick={() => changeMonth(-1)}
                    />
                    <div className={'leave-planner-date-month current'}>
                        <h2>{`${months[month-1]} ${year}`}</h2>
                        <MonthGrid
                            date={currentMonth}
                            selectedDates={selectedDates}
                            setSelectedDate={handleSelection}
                            items={leaveItems}
                            disabled={!newLeave.type || (newLeave.start_date && parseInt(year) !== new Date(newLeave.start_date).getFullYear())}
                        />
                    </div>
                    <div className={'leave-planner-date-month next'}>
                        <h2>{`${months[nextMonth-1]} ${nextYear}`}</h2>
                        <MonthGrid
                            date={`${nextYear}-${nextMonth}`}
                            selectedDates={selectedDates}
                            setSelectedDate={handleSelection}
                            items={leaveItems}
                            disabled={!newLeave.type || (newLeave.start_date && parseInt(nextYear) !== new Date(newLeave.start_date).getFullYear())}
                        />
                    </div>
                    <Button
                        className={'leave-planner-preview-nav forward'}
                        icon={'arrow_forward'}
                        onClick={() => changeMonth(1)}
                    />
                    <div className={'leave-planner-preview-footer'}>
                        {!newLeave.type && <div className={'leave-planner-preview-notice'}>
                            Pick an Absence Type to select dates.
                            </div>
                        }
                        {selectedDates.size > 0 && <Button
                                className={'leave-planner-preview-clear'}
                                label={'Clear date selection'}
                                onClick={() => handleSelection(null)}
                            />
                        }
                    </div>

                </div>
                <EditForm
                    className={'leave-planner-form'}
                    sections={sections}
                    disableSubmit={disableSubmit}
                    onSubmit={() => handleSubmit('request')}
                    submitLabel={ 'Make a Request' }
                    onSubmit2={leaveTypes?.find(leave => leave.id === newLeave.type)?.plannable && (() => handleSubmit('plan'))}
                    submitLabel2={'Save as Planned'}
                    onChange={handleChange}
                    modal={modal}
                    source={newLeave}
                    setSource={setNewLeave}
                />
            </div>
        </div>
    );
}

export default LeavesPlanner;