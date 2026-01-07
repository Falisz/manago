// FRONTEND/components/Timesheets/Index.jsx
import React, {useMemo} from 'react';
import Button from "../Button";
import MonthGrid from "../MonthGrid";
import {days, months, formatDate, generateDateList, getFirstDay, getWeekNumber, sameDay} from "../../utils/dates";
import '../../styles/Timesheets.css';
import useApp from "../../contexts/AppContext";
import useNav from "../../contexts/NavContext";
import {useHolidays, useLeaves, useShifts, useHolidayWorkings, useWeekendWorkings, useProjects} from "../../hooks/useResource";
import Loader from "../Loader";
import { LeaveItem, ShiftItem } from '../Schedules/UserSchedule';

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
    const { openDialog } = useNav();
    const { modules } = appState;
    const { holidays, loading: holidaysLoading, fetchHolidays } = useHolidays();
    const { holidayWorkings, loading: hwLoading, fetchHolidayWorkings } = useHolidayWorkings();
    const { weekendWorkings, loading: wwLoading, fetchWeekendWorkings } = useWeekendWorkings();
    const { shifts, loading: shiftsLoading, fetchShifts } = useShifts();
    const { leaves, loading: leavesLoading, fetchLeaves } = useLeaves();
    const { projects, loading: projectsLoading, fetchProjects } = useProjects();
    const loading = useMemo(() => holidaysLoading || shiftsLoading || leavesLoading || hwLoading || wwLoading || projectsLoading,
        [holidaysLoading, shiftsLoading, leavesLoading, hwLoading, wwLoading, projectsLoading]);

    const projectsEnabled = React.useMemo(() =>
        (modules.find(m => m.title?.toLowerCase() === 'projects')?.enabled && appState.timesheets.projectTimesheets) || false
    , [modules, appState.timesheets]);

    const [yearNo, weekNo] = week?.split('-W').map(Number);
    const startDate = React.useMemo(() => new Date(getFirstDay(week)), [week]);
    const endDate = React.useMemo(() => new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000), [startDate]);

    React.useEffect(() => {
        if (appState.workPlanner.holidays)
            fetchHolidays().then();
        if (projectsEnabled)
            fetchProjects({user: user.id}).then();
    }, [appState.workPlanner, projectsEnabled, user, fetchProjects, fetchHolidays]);

    React.useEffect(() => {
        const start_date = formatDate(startDate);
        const end_date = formatDate(endDate);
        fetchShifts({user: user.id, start_date, end_date}).then();
        fetchWeekendWorkings({user: user.id, start_date, end_date}).then();

        if (appState.workPlanner.holidays)
            fetchHolidayWorkings({user: user.id, start_date, end_date}).then();
        
        if (appState.workPlanner.leaves)
            fetchLeaves({user: user.id, start_date, end_date}).then();

    }, [startDate, endDate, user.id, appState.workPlanner, fetchShifts, fetchLeaves, fetchHolidayWorkings, fetchWeekendWorkings]);

    const dates = React.useMemo(() => {

        return generateDateList(startDate, endDate).map(date => {

            const str = formatDate(date);
            const shortDay = days[date.getDay()];
            const isWeekend = [0,6].includes(date.getUTCDay());
            const holiday = holidays?.find(holiday => sameDay(new Date(holiday.date), date));
            const weekendWorking = isWeekend ? weekendWorkings?.find(ww => ww.date === str ) : null;
            const holidayWorking = holiday ? holidayWorkings?.find(hw => hw.holiday === holiday.id) : null;
            const leave = leaves?.find((l) =>
                            ((date >= new Date(l.start_date) && date <= new Date(l.end_date)) || l.start_date === str)
                                && [1, 2, 4].includes(l.status?.id));
            const fShifts = shifts?.filter(sh => sameDay(new Date(sh.date), date));


            return {
                date,
                str,
                shortDay,
                isWeekend,
                isHoliday: holiday ?? false,
                weekendWorking,
                holidayWorking,
                leave,
                shifts: fShifts
            };

        });

    }, [startDate, endDate, holidays, leaves, shifts, holidayWorkings, weekendWorkings]);

    return (
        <>
            <table className={'timesheet-table'}>
                <thead>
                    <tr className={'header week'}>
                        <th colSpan='7'>
                            Week #{weekNo} of {yearNo}
                        </th>
                    </tr>
                    <tr className={'days'}>
                        {dates.map((date, index) => {

                            if (!date)
                                return null;

                            const { str, isHoliday, isWeekend, shortDay } = date;
                            
                            const onClick = () => {
                                if (isHoliday || isWeekend)
                                    openDialog({content: 'dateDetails', contentId: formatDate(date), closeButton: false});
                            }

                            const className = isHoliday ? 'holiday' : isWeekend ? 'weekend' : null;

                            return (
                                <th key={index} onClick={onClick} className={className}>
                                    <div className={'date'}>{str}</div>
                                    <div className={'short-day'}>{shortDay}</div>
                                </th>
                            );
                        })}
                    </tr>
                    <tr className='header'>
                        <th colSpan={7}>
                            Planned Schedule
                        </th>
                    </tr>
                    <tr className={'schedule'}>
                        {dates.map((date, index) => {

                            const { leave, shifts, isHoliday, isWeekend, holidayWorking, weekendWorking } = date;

                            return (
                                <th key={index}>
                                    {
                                        isWeekend && !weekendWorking ? <div>OFF</div> :
                                        isHoliday && !holidayWorking ? <div>OFF</div> : 
                                        leave ? <LeaveItem leave={leave}/> : 
                                        shifts?.length ? shifts.map((s, i) => <ShiftItem shift={s} key={i}/>) : 
                                        <div>WORKING</div>
                                    }
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                {loading ? <tr><td colSpan={7}><Loader/></td></tr> :
                <>
                    {projectsEnabled && 
                        <tr className='header'>
                            <th colSpan={7}>
                                Non-Project Labor
                            </th>
                        </tr>
                    }
                    <tr key={'no-project'}>
                        {dates.map((date) => (
                            <td key={date.str}>
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
                    {projectsEnabled && 
                        <>
                        <tr className='header'>
                            <th colSpan={7}>
                                Project Labor
                            </th>
                        </tr>
                        {projects?.length ? projects.map((p, i) => 
                            <>
                                <tr className='project-header' >
                                    <th colSpan={7}>
                                        {p.name}
                                    </th>
                                </tr>
                                <tr>
                                    {dates.map((date) => (
                                        <td key={date.str}>
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
                            </>
                        ) : <tr><td>No assigned Projects found.</td></tr>
                        }
                        </>
                    }
                </>}
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