// FRONTEND/components/Timesheets/Index.jsx
import React, {useMemo} from 'react';
import Button from "../Button";
import Loader from "../Loader";
import MonthGrid from "../MonthGrid";
import useApp from "../../contexts/AppContext";
import useNav from "../../contexts/NavContext";
import {useHolidays, useLeaves, useShifts, useHolidayWorkings, useWeekendWorkings, useProjects, useLabor}
    from "../../hooks/useResource";
import { LeaveItem, ShiftItem } from '../Schedules/UserSchedule';
import {days, months, formatDate, generateDateList, getFirstDay, getWeekNumber, sameDay}
    from "../../utils/dates";
import '../../styles/Timesheets.css';

const ClockIn = () => {
    return (
        <>
            Clock In button here with a link to the attendance page.
        </>
    );
};

const WeekSelector = ({week, setWeek}) => {

    const [ month, setMonth ] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [yearNo, monthNo] = month.split('-').map(Number);

    const changeMonth = React.useCallback((val=0) => {
        const newYear = monthNo + val > 12 ? parseInt(yearNo) + 1 : monthNo + val <= 0 ? parseInt(yearNo) - 1 : yearNo;
        const newMonth = String(monthNo + val > 12 ? 1 : monthNo + val <= 0 ? 12 : monthNo + val).padStart(2, '0');

        setMonth(`${newYear}-${newMonth}`);
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

const LaborItem = ({labor, date, project=null, addLabor, deleteLabor, updateLabor}) => {
    return (
        <div className={'labor-wrapper'}>
            {labor?.length && labor.map(l => <div style={{display: 'flex'}}>
                <input
                    id={l.id}
                    className={'hours'}
                    placeholder={'Hours'}
                    value={l?.time}
                    onChange={(e) => updateLabor(l.id,e.target.value)}
                    disabled={[1,2].includes(l?.status?.id)}
                />
                <Button
                    id={'del-'+l.id}
                    transparent
                    icon={'delete'}
                    onClick={() => deleteLabor(l.id)}
                />
            </div>)}
            <Button
                transparent
                icon={'add_circle'}
                onClick={() => addLabor(date, project)}
            />
        </div>
    );
};

const TimeSheet = ({week}) => {

    // TODO: Proper Add (+) Button for adding labor for each date for each project. Object that will handle all that.
    // TODO: Submit button to send the new labor.
    // TODO: Separate UserTimeSheets and ProjectTimeSheets modals to display and approve pending timesheets for Managers
    //  and project managers.

    const { user, appState } = useApp();
    const { openDialog } = useNav();
    const { modules } = appState;
    const { labor, setLabor, loading: lLoading, fetchLabor } = useLabor();
    const { holidays, loading: hLoading, fetchHolidays } = useHolidays();
    const { holidayWorkings, loading: hwLoading, fetchHolidayWorkings } = useHolidayWorkings();
    const { weekendWorkings, loading: wwLoading, fetchWeekendWorkings } = useWeekendWorkings();
    const { shifts, loading: shLoading, fetchShifts } = useShifts();
    const { leaves, loading: lvLoading, fetchLeaves } = useLeaves();
    const { projects, loading: pLoading, fetchProjects } = useProjects();
    const loading = useMemo(() => lLoading || hLoading || hwLoading || wwLoading || shLoading || lvLoading || pLoading,
        [lLoading, hLoading, hwLoading, wwLoading, shLoading, lvLoading, pLoading]);

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
        const query = {user: user.id, start_date, end_date};

        fetchLabor(query).then();
        fetchShifts(query).then();
        fetchWeekendWorkings(query).then();
        if (appState.workPlanner.holidays) fetchHolidayWorkings(query).then();
        if (appState.workPlanner.leaves) fetchLeaves(query).then();

    }, [startDate, endDate, user.id, appState.workPlanner,
        fetchShifts, fetchLeaves, fetchLabor, fetchHolidayWorkings, fetchWeekendWorkings]);

    const dates = React.useMemo(() => {

        return generateDateList(startDate, endDate).map(date => {

            const str = formatDate(date);
            const shortDay = days[date.getDay()];
            const isWeekend = [0,6].includes(date.getUTCDay());
            const holiday = holidays?.find(holiday => sameDay(new Date(holiday.date), date));
            const weekendWorking = isWeekend ? weekendWorkings?.find(ww => ww.date === str ) : null;
            const holidayWorking = holiday ? holidayWorkings?.find(hw => hw.holiday.id === holiday.id) : null;
            const leave = leaves?.find((l) =>
                            ((date >= new Date(l.start_date) && date <= new Date(l.end_date)) || l.start_date === str)
                                && [1, 2, 4].includes(l.status?.id));
            const fShifts = shifts?.filter(sh => sameDay(new Date(sh.date), date));
            const isWorking = !((holiday && !holidayWorking) || (isWeekend && !weekendWorking));

            const fLabor = labor?.filter(l => sameDay(new Date(l.date), date)).reduce((acc, labor) => {
                const key = labor.project == null ? 'nonProject' : labor.project;
                if (!acc[key]) acc[key] = [];
                acc[key].push(labor);
                return acc;
            }, {})

            return {
                date,
                str,
                shortDay,
                isWorking,
                isWeekend,
                isHoliday: holiday ?? false,
                weekendWorking,
                holidayWorking,
                labor: fLabor,
                leave,
                shifts: fShifts
            };

        });

    }, [startDate, endDate, holidays, leaves, shifts, holidayWorkings, weekendWorkings, labor]);

    const [count, setCount] = React.useState(0);

    const addLabor = React.useCallback((date, project) => {
        setLabor(prev => [...prev, { id: 'new-'+count, date, project }]);
        setCount(prev => prev + 1);
    }, [setCount, count, setLabor]);

    const deleteLabor = React.useCallback((id) => {
        setLabor(prev => prev.filter(l => l.id !== id));
    }, [setLabor]);

    const updateLabor = React.useCallback((id, time) => {
        setLabor(prev => [...prev.filter(l => l.id !== id), {...prev.find(l => l.id === id), time}]);
    }, [setLabor]);

    const saveLabor = React.useCallback(() => {
        // Implementation for saving labor data
        console.log('Saving labor data:', labor);
    }, [labor]);

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
                                    openDialog({content: 'dateDetails', contentId: str, closeButton: false});
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
                    <tr className={'no-project-labor'}>
                        {dates.map((date) =>
                            <td key={date.str}> {
                                !date || !date.isWorking ? 'OFF' : (
                                    <LaborItem
                                        labor={date.labor?.['nonProject']}
                                        addLabor={addLabor}
                                        updateLabor={updateLabor}
                                        deleteLabor={deleteLabor}
                                        date={date.str}
                                    />
                                )}
                            </td>
                        )}
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
                                <tr className='project-header' key={`${i}h`}>
                                    <th colSpan={7}>
                                        {p.name}
                                    </th>
                                </tr>
                                <tr className={'project-labor'} key={`${i}l`}>
                                    {dates.map((date) =>
                                        <td key={date.str}> {
                                        !date || !date.isWorking ? 'OFF' : (
                                            <LaborItem
                                                labor={date.labor?.[p.id]}
                                                project={p.id}
                                                addLabor={addLabor}
                                                updateLabor={updateLabor}
                                                deleteLabor={deleteLabor}
                                                date={date.str}
                                            />
                                        )}
                                        </td>
                                    )}
                                </tr>
                            </>
                        ) : <tr>
                            <td colSpan={7}>No assigned Projects found.</td>
                        </tr>
                        }
                        </>
                    }
                    <tr><td colSpan={7}><Button label={'Save Labor'} icon={'save'} onClick={saveLabor}/></td></tr>
                </>}
                </tbody>
            </table>
        </>
    );
};

const TimesheetDashboard = () => {
    const { timesheets: config } = useApp().appState;

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
                <WeekSelector week={week} setWeek={setWeek} />
            </section>
            <section className={'timesheet'}>
                <TimeSheet week={week}/>
            </section>
        </>
    );
};

export default TimesheetDashboard;