// FRONTEND/components/Leaves/Planner.jsx
import React, {useMemo} from 'react';
import MonthGrid from "../MonthGrid";
import Button from "../Button";
import {generateDateList, formatDate} from "../../utils/dates";
import '../../styles/LeavesPlanner.css';
import {useLeaves, useLeaveTypes} from "../../hooks/useResource";
import useApp from "../../contexts/AppContext";
import EditForm from "../EditForm";

function LeavesPlanner( {modal} ) {
    const { user, refreshTriggers } = useApp();
    const { leaves, fetchLeaves, saveLeave } = useLeaves();
    const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
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

    React.useEffect(() => {
        fetchLeaveTypes().then();
    }, [fetchLeaveTypes]);

    React.useEffect(() => {
        const refresh = refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.leaves;
        if (refresh || !leaves) fetchLeaves({ user: user.id });
    }, [fetchLeaves, leaves, refreshTriggers, user.id]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const [year, monthStr] = selectedMonth.split('-');
    const month = parseInt(monthStr, 10);
    const currentMonth = `${year}-${month}`;

    const handleSelection = React.useCallback((date) => {
        const {start_date, end_date} = newLeave;

        if (!start_date && !end_date) {
            setNewLeave({...newLeave, start_date: date});
            setSelectedDates(new Set([date]));
            return;
        }

        if (start_date && !end_date) {
            if (new Date(start_date) < new Date(date)) {
                setNewLeave({...newLeave, end_date: date});
                const dates = generateDateList(start_date, date).map(formatDate);
                setSelectedDates(new Set([...dates]));
            } else {
                setNewLeave({...newLeave, start_date: date, end_date: start_date});
                const dates = generateDateList(date, start_date).map(formatDate);
                setSelectedDates(new Set([...dates]));
            }
        }

        if (!start_date && end_date) {
            if (new Date(end_date) > new Date(date)) {
                setNewLeave({...newLeave, start_date: date});
                const dates = generateDateList(date, end_date).map(formatDate);
                setSelectedDates(new Set([...dates]));
            } else {
                setNewLeave({...newLeave, start_date: end_date, end_date: date});
                const dates = generateDateList(end_date, date).map(formatDate);
                setSelectedDates(new Set([...dates]));
            }
        }

        if (start_date && end_date) {
            setNewLeave({...newLeave, start_date: date, end_date: null});
            setSelectedDates(new Set([date]));
        }
    },[newLeave]);

    const changeMonth = React.useCallback((val=0) => {

        const newYear = month + val > 12 ? parseInt(year) + 1 : month + val <= 0 ? parseInt(year) - 1 : year;
        const newMonth = String(month + val > 12 ? 1 : month + val <= 0 ? 12 : month + val).padStart(2, '0');

        setSelectedMonth(`${newYear}-${newMonth}`)
    }, [month, year]);

    const nextYear = month + 1 > 12 ? parseInt(year) + 1 : year;
    const nextMonth = String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0');

    const sections = useMemo(() => ({
        0: {
            fields: {
                type: {
                    type: 'combobox',
                    label: 'Leave Type',
                    searchable: false,
                    required: true,
                    options: leaveTypes?.map(type => ({id: type.id, name: type.name})) || []
                }
            }
        },
        1: {
            style: {flexWrap: 'nowrap'},
            fields: {
                start_date: {
                    type: 'date',
                    label: 'Start Date',
                    required: true,
                    max: newLeave.end_date,
                },
                end_date: {
                    type: 'date',
                    label: 'End Date',
                    required: true,
                    min: newLeave.start_date,
                    disabled: !newLeave.start_date
                },
                days: {
                    type: 'content',
                    label: 'Days',
                    content: (data) => {
                        let days = 0;

                        if (data.start_date && data.end_date) {
                            const start = new Date(data.start_date);
                            const end = new Date(data.end_date);

                            if (!isNaN(start) && !isNaN(end)) {
                                const diffInMs = end - start;
                                days = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
                            }
                        }
                        return <span style={{padding: '5px'}}>{days} days</span>;
                    }
                }
            }
        },
        2: {
            fields: {
                status: {
                    type: 'checkbox',
                    label: 'request',
                    inputLabel: 'Request for Leave',
                    style: {alignItems: 'flex-start'}
                }
            }
        }
    }), [newLeave, leaveTypes]);

    const handleChange = (target) => {
        const {name, value} = target;

        if (name === 'start_date' || name === 'end_date') {
            const {start_date, end_date} = newLeave;
            if ((start_date && end_date) || (start_date && name ==='end_date') || (start_date && name === 'end_date')) {
                let dates = [];
                if (name === 'start_date') dates = generateDateList(value, end_date).map(formatDate);
                else if (name === 'end_date') dates = generateDateList(start_date, value).map(formatDate);
                setSelectedDates(new Set([...dates]));
            } else {
                setSelectedDates(new Set([value]));
            }
        }
    }

    const leaveItems = useMemo(() => {
        const dates = {};
        leaves?.filter(leave => ![3,5].includes(leave.status.id)).forEach(leave => {
            leave.item_type='leave';
            const { start_date, end_date } = leave;
            if (start_date && end_date)
                generateDateList(start_date, end_date).map(formatDate).forEach(date => dates[date] = leave);
            else if (start_date)
                dates[start_date] = leave;
        });
        return dates;
    }, [leaves]);

    return (
        <div className={'leave-planner'}>
            <div className={'leave-planner-header'}>
                <h1>New Leave</h1>
            </div>
            <div className={'leave-planner-content'}>
                <Button
                    className={'leave-planner-preview-nav'}
                    icon={'arrow_back'}
                    onClick={() => changeMonth(-1)}
                />
                <div>
                    <h2>{`${months[month-1]} ${year}`}</h2>
                    <MonthGrid
                        date={currentMonth}
                        selectedDates={selectedDates}
                        setSelectedDate={handleSelection}
                        items={leaveItems}
                    />
                </div>
                <div>
                    <h2>{`${months[nextMonth-1]} ${nextYear}`}</h2>
                    <MonthGrid
                        date={`${nextYear}-${nextMonth}`}
                        selectedDates={selectedDates}
                        setSelectedDate={handleSelection}
                        items={leaveItems}
                    />
                </div>
                <Button
                    className={'leave-planner-preview-nav'}
                    icon={'arrow_forward'}
                    onClick={() => changeMonth(1)}
                />
                <EditForm
                    className={'leave-planner-form'}
                    sections={sections}
                    onSubmit={async () => await saveLeave({data: newLeave})}
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