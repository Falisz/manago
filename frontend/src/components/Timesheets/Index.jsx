// FRONTEND/components/Timesheets/Index.jsx
import React, {useMemo} from 'react';
import Button from "../Button";
import MonthGrid from "../MonthGrid";
import {days, months, formatDate, generateDateList, getFirstDay, getWeekNumber} from "../../utils/dates";
import '../../styles/Timesheets.css';
import useApp from "../../contexts/AppContext";
import {useHolidays, useLeaves, useShifts} from "../../hooks/useResource";
import Loader from "../Loader";

const ClockIn = () => {
    return (
        <>
            Clock In button here with a link to the attendance page.
        </>
    );
};

const WeekSelector = ({month, setMonth, week, setWeek}) => {
    const [yearNo, monthNo] = month.split('-').map(Number);

    const changeMonth = React.useCallback((val=0) => {
        const newYear = monthNo + val > 12 ? parseInt(yearNo) + 1 : monthNo + val <= 0 ? parseInt(yearNo) - 1 : yearNo;
        const newMonth = String(monthNo + val > 12 ? 1 : monthNo + val <= 0 ? 12 : monthNo + val).padStart(2, '0');

        setMonth(`${newYear}-${newMonth}`)
    }, [yearNo, monthNo, setMonth]);

    const handleSelection = React.useCallback((week) => setWeek(week), [setWeek]);

    return (
        <>
            <Button
                className={'leave-planner-preview-nav back'}
                icon={'arrow_back'}
                onClick={() => changeMonth(-1)}
            />
            <div className={'leave-planner-date-month current'}>
                <h2>{`${months[monthNo-1]} ${yearNo}`}</h2>
                <MonthGrid
                    date={month}
                    selectedWeek={week}
                    selectWeek={handleSelection}
                />
            </div>
            <Button
                className={'leave-planner-preview-nav forward'}
                icon={'arrow_forward'}
                onClick={() => changeMonth(1)}
            />
        </>
    )
};

const TimeSheet = ({week}) => {

    // TODO: Add fetching of Users Schedule, Users Special working agreements, user labors, user projects and user tasks.
    // TODO: Below Dates and above Labor there should be row with scheduled shifts and absences for reference.
    // TODO: with ProjectsEnabled the table will be rendered with multiple rows for each project that have relevant stuff.

    // TODO: Separate UserTimeSheets and ProjectTimeSheets modals to display and approve pending timesheets for Managers
    //  and project managers.

    const { user, appState } = useApp();
    const { modules } = appState;
    const { holidays, loading: holidaysLoading, fetchHolidays } = useHolidays();
    const { shifts, loading: shiftsLoading, fetchShifts } = useShifts();
    const { leaves, loading: leavesLoading, fetchLeaves } = useLeaves();
    const loading = useMemo(() => holidaysLoading || shiftsLoading || leavesLoading,
        [holidaysLoading, shiftsLoading, leavesLoading]);

    const projectsEnabled = React.useMemo(() =>
        modules.find(m => m.title?.toLowerCase() === 'projects')?.enabled || false
    , [modules]);

    const [yearNo, weekNo] = week?.split('-W').map(Number);
    const startDate = React.useMemo(() => new Date(getFirstDay(week)), [week]);
    const endDate = React.useMemo(() => new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000), [startDate]);
    const dates = React.useMemo(() => generateDateList(startDate, endDate), [startDate, endDate]);

    React.useEffect(() => {
        if (appState.workPlanner.holidays)
            fetchHolidays().then();
    }, [appState.workPlanner, fetchHolidays]);

    React.useEffect(() => {
        const start_date = formatDate(startDate);
        const end_date = formatDate(endDate);
        fetchShifts({user: user.id, start_date, end_date}).then();
        if (appState.workPlanner.leaves)
            fetchLeaves({user: user.id, start_date, end_date}).then();

    }, [startDate, endDate, user.id, fetchShifts, fetchLeaves, appState.workPlanner ]);

    console.log(projectsEnabled, holidays, shifts, leaves);

    return (
        <>
            <table className={'timesheet-table'}>
                <thead>
                    <tr key={'week'}>
                        <th colSpan='7'>
                            Week #{weekNo} of {yearNo}
                        </th>
                    </tr>
                    <tr key={'days'}>
                        {dates.map((date, index) => (
                                <th key={index}>
                                    <div className={'date'}>{formatDate(date)}</div>
                                    <div className={'short-day'}>{days[date.getDay()]}</div>
                                </th>
                        ))}
                    </tr>
                    {

                    }
                </thead>
                <tbody>
                {loading ? <tr><td colSpan='7'><Loader/></td></tr> :
                <tr key={'no-project'}>
                    {dates.map((date, index) => (
                        <td key={index}>
                            <input
                                className={'hours'}
                                type={'number'}
                                placeholder={'Hours'}
                                min={0}
                                max={24}
                            />
                        </td>
                    ))}
                </tr>}
                </tbody>
            </table>
        </>
    );
};

const TimesheetDashboard = () => {
    const { timesheets: config } = useApp().appState;

    const [ month, setMonth ] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [ week, setWeek ] = React.useState(() => {
        const [ week, year ] = getWeekNumber(new Date());
        return `${year}-W${String(week).padStart(2, '0')}`
    }
    );

    return (
        <>
            {config.attendance && <section className={'clock-in'}>
                <ClockIn/>
            </section>}
            <section className={'week-selector'}>
                <WeekSelector month={month} setMonth={setMonth} week={week} setWeek={setWeek} />
            </section>
            <section className={'timesheet'}>
                <TimeSheet week={week}/>
            </section>
        </>
    );
};

export default TimesheetDashboard;