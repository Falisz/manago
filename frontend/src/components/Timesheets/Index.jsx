// FRONTEND/components/Timesheets/Index.jsx
import React from 'react';
import Button from "../Button";
import MonthGrid from "../MonthGrid";
import {days, formatDate, generateDateList, getFirstDay, getWeekNumber} from "../../utils/dates";
import '../../styles/Timesheets.css';
import useApp from "../../contexts/AppContext";

// TODO: Timesheets settings:
//  Enable Attendance?
//  Enable Labor cap based on recorded attendance?
//  Enable project timesheets?
//  Base Timesheets solely on Schedule - this disables project and task based Labor, and Labor is pre-filled with shift data.

const ClockIn = () => {
    return (
        <>
            Clock In button here with a link to the attendance page.
        </>
    );
};

const WeekSelector = ({month, setMonth, week, setWeek}) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

    const { modules } = useApp().appState;

    const projectsEnabled = React.useMemo(() => {

        return modules.find(m => m.title?.toLowerCase() === 'projects')?.enabled || false

    }, [modules]);

    console.log(projectsEnabled);

    // TODO: Add fetching of Users Schedule, Users Special working agreements, user labors, user projects and user tasks.
    // TODO: Below Dates and above Labor there should be row with scheduled shifts and absences for reference.
    // TODO: with ProjectsEnabled the table will be rendered with multiple rows for each project that have relevant stuff.

    // TODO: Separate UserTimeSheets and ProjectTimeSheets modals to display and approve pending timesheets for Managers
    //  and project managers.

    const startDate = React.useMemo(() => new Date(getFirstDay(week)), [week]);
    const endDate = React.useMemo(() => new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000), [startDate]);
    const dates = React.useMemo(() => generateDateList(startDate, endDate), [startDate, endDate]);

    const [yearNo, weekNo] = week?.split('-W')

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
                </thead>
                <tbody>
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
                    </tr>
                </tbody>
            </table>
        </>
    );
};

const TimesheetDashboard = () => {
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
            <section className={'clock-in'}>
                <ClockIn/>
            </section>
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