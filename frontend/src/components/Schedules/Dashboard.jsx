// FRONTEND/components/Schedules/Dashboard.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import SchedulesIndex from './Index';
import '../../styles/Schedules.css';
import {formatDate, generateDateList} from "../../utils/dates";
import useApp from "../../contexts/AppContext";
import {useHolidays, useLeaves, useShifts} from "../../hooks/useResource";
import useNav from "../../contexts/NavContext";

const YourSchedulePreview = () => {

    const { user } = useApp();
    const { openDialog } = useNav();
    const { holidays, loading: holidaysLoading, fetchHolidays } = useHolidays();
    const { shifts, loading: shiftsLoading, fetchShifts } = useShifts();
    const { leaves, loading: leavesLoading, fetchLeaves } = useLeaves();
    const loading = useMemo(() => holidaysLoading || shiftsLoading || leavesLoading,
        [holidaysLoading, shiftsLoading, leavesLoading]);
    const today = useMemo(() => new Date(), []);
    const next7Days = useMemo(() => new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000), [today]);
    const range = generateDateList(today, next7Days);
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current)
            return;
        isMounted.current = true;
        const start_date = formatDate(today);
        const end_date = formatDate(next7Days);
        fetchHolidays().then();
        fetchShifts({user: user.id, start_date, end_date}).then();
        fetchLeaves({user: user.id, start_date, end_date}).then();

    }, [fetchHolidays, fetchShifts, fetchLeaves, user.id, today, next7Days]);

    return (
        <div className={'your-schedule-preview your-schedule app-scroll app-overflow-y'}>
            <h1>Your Schedule</h1>
            {loading && <p>Loading...</p>}
            {!loading && range.map((date, index) => {

                const strDate = formatDate(date);
                const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayOfWeek = weekdayNames[date.getDay()];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const holiday = holidays?.find(holiday => holiday.date === strDate);
                const todayShifts = shifts?.filter(shift => shift.date === strDate)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const leave = leaves?.find(leave => leave.start_date === strDate ||
                    (new Date(leave.end_date) >= date && new Date(leave.start_date) <= date));

                const empty = !holiday && !todayShifts?.length && !leave;

                return (
                    <div
                        key={index}
                        className={'schedule-day'
                            + (isWeekend ? ' weekend' : '')
                            + (holiday ? ' holiday' : '')
                            + (empty ? ' empty' : '')
                        }
                    >
                        <span className={'day-tag'}>{formatDate(date)} | {dayOfWeek}</span>
                        <div className={'day-content'}>
                            {holiday && <span
                                className={'schedule-item'}
                                onClick={() => openDialog(
                                    {content: 'holidayDetails', contentId: holiday.id, closeButton: false}
                                )}
                            >
                                {holiday.name}
                            </span>}
                            {leave && <span
                                className={'schedule-item'}
                                style={{background: leave.type?.color || '#000000'}}
                                onClick={() => openDialog(
                                    {content: 'leaveDetails', contentId: leave.id, closeButton: false}
                                )}
                            >
                                {leave.type?.name}
                            </span>}
                            {todayShifts?.map((shift, index) =>
                                <span
                                    key={index}
                                    className={'schedule-item'}
                                    style={{background: shift.job_post?.color || '#000000'}}
                                    onClick={() => openDialog(
                                        {content: 'shiftDetails', contentId: shift.id, closeButton: false}
                                    )}
                                >
                                    {shift.job_post?.name || 'Shift'}&nbsp;
                                    ({shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)})
                                </span>
                            )}
                            {empty && <span className={'schedule-item'}>{isWeekend ? 'Weekend' : 'Nothing planned'}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const SchedulesDashboard = () => {
    return (
        <div className={'schedules-dashboard app-scroll'}>
            <div className={'schedules-dashboard-widget your-schedule'}>
                <YourSchedulePreview/>
            </div>
            <div className={'schedules-dashboard-widget your-team-schedule'}>
                <h1>Your Team</h1>
                <p>Here you can view brief schedule glance of dropdown chosen Team that you are part - next 3 days inc today.</p>
            </div>
            <div className={'schedules-dashboard-widget schedule-drafts'}>
                <SchedulesIndex />
            </div>
            <div className={'schedules-dashboard-widget pending-approvals'}>
                <h1>Pending Approvals</h1>
                <p>Oncoming Leaves/Holiday Working to approve or reject...</p>
            </div>
        </div>
    );
};

export default SchedulesDashboard;