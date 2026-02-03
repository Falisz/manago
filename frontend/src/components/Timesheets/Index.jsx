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
import Icon from "../Icon";

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

const LaborItem = ({labor, date, project=null, update, disabled}) => {
    const colors = {
        1: '#777',
        2: '#3a3ae6',
        3: '#67d811',
        4: '#dd3636'
    };
    return (
        <div className={'labor-wrapper'}>
            <input
                className={'labor-item'}
                placeholder={'Hours'}
                onChange={(e) => update({id: labor?.id, date, project, time: e.target.value})}
                disabled={disabled || [2, 3].includes(labor?.status?.id)}
                value={labor?.time}
            />
            <Icon
                style={{color: colors[labor?.status?.id ?? 1], cursor: 'default'}}
                i={'radio_button_checked'}
                s
                title={labor?.status?.name ?? 'Empty'}
            />
        </div>
    );
};

const TimeSheet = ({week}) => {
    const { user, appState, refreshTriggers } = useApp();
    const { openDialog } = useNav();
    const { modules } = appState;
    const { labor, setLabor, loading: lLoading, fetchLabor, saveLabor } = useLabor();
    const { holidays, loading: hLoading, fetchHolidays } = useHolidays();
    const { holidayWorkings, loading: hwLoading, fetchHolidayWorkings } = useHolidayWorkings();
    const { weekendWorkings, loading: wwLoading, fetchWeekendWorkings } = useWeekendWorkings();
    const { shifts, loading: shLoading, fetchShifts } = useShifts();
    const { leaves, loading: lvLoading, fetchLeaves } = useLeaves();
    const { projects, loading: pLoading, fetchProjects } = useProjects();
    const loading = useMemo(() => lLoading || hLoading || hwLoading || wwLoading || shLoading || lvLoading || pLoading,
        [lLoading, hLoading, hwLoading, wwLoading, shLoading, lvLoading, pLoading]);

    const [count, setCount] = React.useState(0);
    const laborUpdate = React.useRef({
        new: new Set(),
        update: new Set(),
        delete: new Set()
    })

    const projectsEnabled = React.useMemo(() =>
        (modules.find(m => m.title?.toLowerCase() === 'projects')?.enabled && appState.timesheets.projectTimesheets) || false
    , [modules, appState.timesheets]);

    const [yearNo, weekNo] = week?.split('-W').map(Number);
    const startDate = React.useMemo(() => new Date(getFirstDay(week)), [week]);
    const endDate = React.useMemo(() => new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000), [startDate]);

    const [submittable, setSubmittable] = React.useState(false);

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

        fetchShifts(query).then();
        fetchWeekendWorkings(query).then();
        if (appState.workPlanner.holidays) fetchHolidayWorkings(query).then();
        if (appState.workPlanner.leaves) fetchLeaves(query).then();

    }, [startDate, endDate, user.id, appState.workPlanner,
        fetchShifts, fetchLeaves, fetchHolidayWorkings, fetchWeekendWorkings]);

    React.useEffect(() => {
        const start_date = formatDate(startDate);
        const end_date = formatDate(endDate);
        const query = {user: user.id, start_date, end_date};

        if (refreshTriggers.labors)
            delete refreshTriggers.labors;

        fetchLabor(query).then();
    }, [startDate, endDate, user.id, refreshTriggers.labors, fetchLabor]);

    const dates = React.useMemo(() => {
        return generateDateList(startDate, endDate).map(date => {
            const str = formatDate(date);
            const isFuture = date > new Date();
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
                const key = labor.project == null ? 'nonProject' : labor.project.id;
                acc[key] = labor;
                return acc;
            }, {})

            return {
                date,
                str,
                shortDay,
                isWorking,
                isWeekend,
                isFuture,
                isHoliday: holiday ?? false,
                weekendWorking,
                holidayWorking,
                labor: fLabor,
                leave,
                shifts: fShifts
            };
        });
    }, [startDate, endDate, holidays, leaves, shifts, holidayWorkings, weekendWorkings, labor]);

    const updateLabor = React.useCallback(({id, date, project, time}) => {
        if (time)
            time = parseInt(time, 10);

        console.log(id, date, project, time, laborUpdate.current);

        if (id && time) {
            setLabor(prev => [...prev.filter(l => l.id !== id), {...prev.find(l => l.id === id), time}]);
            if (typeof id === 'number') laborUpdate.current.update.add(id);
        }
        if (!id && time) {
            const newId = 'new-'+count;
            setCount(prev => prev + 1);
            setLabor(prev => [...prev, { id: newId, date, project: {id: project}, time }]);
            laborUpdate.current.new.add(newId);
        }
        if (id && !time) {
            setLabor(prev => prev.filter(l => l.id !== id));
            if (typeof id === 'string' && id.startsWith('new')) laborUpdate.current.new.delete(id);
            else {
                laborUpdate.current.update.delete(id);
                laborUpdate.current.delete.add(id);
            }
        }
        const { new: newLabor, update: updateLabor, delete: deleteLabor } = laborUpdate.current;
        setSubmittable(Boolean(newLabor.size || updateLabor.size || deleteLabor.size));
    }, [setCount, count, setLabor]);

    const submitLabor = React.useCallback(async () => {
        const data = {
            new: labor.filter(l => laborUpdate.current.new.has(l.id)).map(l => ({
                date: l.date,
                project: l.project?.id,
                user: l.user?.id,
                time: l.time,
                type: 1,
                status: 2
            })),
            update: labor.filter(l => laborUpdate.current.update.has(l.id)).map(l => ({
                id: l.id,
                date: l.date,
                project: l.project?.id,
                user: l.user?.id,
                time: l.time,
                type: 1,
                status: 2
            })),
            delete: Array.from(laborUpdate.current.delete)
        };
        const success = await saveLabor({data});
        if (success) laborUpdate.current = { new: new Set(), update: new Set(), delete: new Set() }
    }, [labor, saveLabor]);

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
                                        (isWeekend && !weekendWorking) || (isHoliday && !holidayWorking) ?
                                            <div className={'sched-item'}>OFF</div> :
                                        leave ? <LeaveItem leave={leave}/> : 
                                        shifts?.length ? shifts.map((s, i) => <ShiftItem shift={s} key={i}/>) : 
                                        <div className={'sched-item'}>WORKING</div>
                                    }
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                {loading ? <tr><td colSpan={7}><Loader/></td></tr> :
                <>
                    <tr className='header'>
                        <th colSpan={7}>
                            Labor
                        </th>
                    </tr>
                    {projectsEnabled &&
                        <tr className='project-header' key={`nph`}>
                            <th colSpan={7}>
                                Non-project Labor
                            </th>
                        </tr>
                    }
                    <tr className={'no-project-labor'}>
                        {dates.map((date) =>
                            <td key={date.str}> {
                                !date || !date.isWorking ? 'OFF' : (
                                    <LaborItem
                                        labor={date.labor?.['nonProject']}
                                        date={date.str}
                                        update={updateLabor}
                                        disabled={date.isFuture}
                                    />
                                )}
                            </td>
                        )}
                    </tr>
                    {projectsEnabled ? projects?.length ? projects.map((p, i) =>
                        <React.Fragment key={i}>
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
                                            date={date.str}
                                            project={p.id}
                                            update={updateLabor}
                                            disabled={date.isFuture}
                                        />
                                    )}
                                    </td>
                                )}
                            </tr>
                        </React.Fragment>
                    ) :
                        <>
                            <tr className='project-header' key={`no-proj-f`}>
                                <th colSpan={7}>Other projects</th>
                            </tr>
                            <tr>
                                <td colSpan={7}>No assigned Projects found.</td>
                            </tr>
                        </> : null
                        }
                </>}
                <tr className={'timesheet-submit-row'}>
                    <td colSpan={7}>
                        <Button
                            label={'Submit Timesheet'}
                            icon={'save'}
                            onClick={submitLabor}
                            disabled={!submittable}
                        />
                    </td>
                </tr>
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