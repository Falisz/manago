// FRONTEND/components/Schedules/Dashboard.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import SchedulesIndex from './Index';
import '../../styles/Schedules.css';
import {formatDate, generateDateList} from "../../utils/dates";
import useApp from "../../contexts/AppContext";
import {
    useHolidays,
    useHolidayWorkings,
    useLeaves,
    useShifts,
    useTeams,
    useWeekendWorkings
} from "../../hooks/useResource";
import useNav from "../../contexts/NavContext";
import ComboBox from "../ComboBox";
import useSchedules from "../../hooks/useSchedules";
import Loader from "../Loader";
import UserSchedule from "./UserSchedule";
import {useNavigate} from "react-router-dom";

const YourSchedulePreview = ({header}) => {

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
        <>
            {header && <h1>Your Schedule</h1>}
            {loading && <p>Loading...</p>}
            {!loading && <div className={'your-schedule-preview app-scroll app-overflow-y'}>
                {range.map((date, index) => {

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
                                            ({shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)})
                                </span>
                                )}
                                {empty && <span
                                    className={'schedule-item'}
                                    onClick={isWeekend ? () => openDialog(
                                        {content: 'weekendDetails', contentId: formatDate(date), closeButton: false}
                                    ) : null}
                                >{isWeekend ? 'Weekend' : 'Nothing planned'}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>}
        </>
    );
};

const YourTeamSchedule = ({header}) => {
    const { user, refreshTriggers } = useApp();
    const { teams, fetchTeams } = useTeams();
    const { schedule, loading, setLoading, getSchedule } = useSchedules();
    const isMounted = useRef(false);

    useEffect(() => {
        fetchTeams({ all: true, user: user.id, members: false, subteams: false }).then();
    }, [fetchTeams, user.id]);

    useEffect(() => {
        if (!isMounted.current) return;
        const refresh = refreshTriggers?.shifts || refreshTriggers?.leaves || false;
        if (refresh) delete refreshTriggers.shifts;
        if (refresh) delete refreshTriggers.leaves;
        if (schedule && refresh) getSchedule(schedule).then();
    }, [isMounted, refreshTriggers, getSchedule, schedule]);

    useEffect(() => {
        if (isMounted.current || !teams)
            return;

        isMounted.current = true;

        setLoading(true);

        const DAY_IN_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const start_date = formatDate(new Date(now));
        const end_date = formatDate(new Date(now + 2 * DAY_IN_MS));

        getSchedule({
            name: 'Current Schedule',
            start_date,
            end_date,
            user_scope: 'team',
            user_scope_id: (teams.length && teams[0].id) || null
        }).then();

    }, [teams, user.id, setLoading, fetchTeams, getSchedule]);

    const title = useMemo(() => {
        const value = teams?.length > 1 ? 'Your' : teams?.find(t => t.id === schedule?.user_scope_id)?.name || 'Your'
        return `${value} Team Schedule`
    }, [teams, schedule]);

    return (
        <>
            <div className={'header'}>
                {header && <h1>{title}</h1>}
                {teams?.length > 1 ? <ComboBox
                    placeholder={`Pick a Team`}
                    name={'user_scope_id'}
                    style={{marginLeft: 'auto'}}
                    searchable={false}
                    value={schedule?.user_scope_id || null}
                    options={teams.map((team) => ({id: team.id, name: team.name}))}
                    onChange={async (e) => await getSchedule({...schedule, user_scope_id: e.target.value})}
                /> : null}
            </div>
            { teams && teams.length === 0 ? <p>No Teams to display.</p> :
                loading ? <Loader/> : schedule && <UserSchedule schedule={schedule}/>}
        </>
    );
};

const ApprovalItem = ({approval}) => {

    const { openDialog } = useNav();

    if (!approval)
        return null;

    const { id, type, name, type_color, date, end_date, user, status } = approval;

    const handleClick = () => {
        if (type === 'absence')
            openDialog({content: 'leaveDetails', contentId: id, closeButton: false});
        else if (type === 'holidayWorking')
            openDialog({content: 'holidayWorking', contentId: id, closeButton: false});
        else if (type === 'weekendWorking')
            openDialog({content: 'weekendWorking', contentId: id, closeButton: false});
    };

    const color = type === 'absence' ? type_color : type === 'holidayWorking' ? 'firebrick' : 'var(--color)';

    return (
        <div className={'approval-item app-clickable'} onClick={handleClick}>
            <h2 style={{color}}>{name}</h2>
            <p>{user.first_name} {user.last_name}</p>
            <p>{date}{end_date && ` - ${end_date}`}</p>
            <p><i>{status?.name || 'Unknown status'}</i></p>
        </div>
    );
};

const PendingApprovals = ({header}) => {
    const { user, refreshTriggers } = useApp();
    const { leaves, loading: leavesLoading, fetchLeaves } = useLeaves();
    const { holidayWorkings, loading: holidayWorkingLoading, fetchHolidayWorkings } = useHolidayWorkings();
    const { weekendWorkings, loading: weekendWorkingLoading, fetchWeekendWorkings } = useWeekendWorkings();
    const loading = useMemo(() => leavesLoading || holidayWorkingLoading || weekendWorkingLoading,
        [leavesLoading, holidayWorkingLoading, weekendWorkingLoading]);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!user.id) return;

        const refreshLeave = refreshTriggers?.leaves || refreshTriggers?.aleave || false;
        if (refreshLeave) { delete refreshTriggers.leaves; delete refreshTriggers.aleave; }
        if (refreshLeave || !leaves) fetchLeaves({ user_scope: 'manager', user_scope_id: user.id }).then();

        const refreshHW = refreshTriggers?.holidayWorking || false;
        if (refreshHW) delete refreshTriggers.holidayWorking;
        if (refreshHW || !weekendWorkings) fetchHolidayWorkings({ managed: user.id }).then();

        const refreshWW = refreshTriggers?.weekendWorking || false;
        if (refreshWW) delete refreshTriggers.weekendWorking;
        if (refreshWW || !holidayWorkings) fetchWeekendWorkings({ managed: user.id }).then();

    }, [user.id, refreshTriggers, leaves, fetchLeaves, weekendWorkings, fetchWeekendWorkings, holidayWorkings,
        fetchHolidayWorkings]);

    const pendingApprovals = useMemo(() => {
        if (!leaves || !weekendWorkings || !holidayWorkings)
            return [];

        const getDay = (str) => {
            const date = new Date(str);
            const day = date.getDay();
            return day === 0 ? 'Sunday' : 'Saturday';
        };

        return [
            ...leaves.filter(l=> [1, 4].includes(l.status.id)).map(l => ({
                id: l.id,
                type: 'absence',
                type_color: l.type?.color,
                name: l.type?.name || 'Leave',
                status: l.status,
                user: l.user,
                date: l.start_date,
                end_date: l.end_date
            })),
            ...weekendWorkings.filter(l=> [1, 4].includes(l.status.id)).map(ww => ({
                id: ww.id,
                type: 'weekendWorking',
                name: getDay(ww.date) + ' Working',
                status: ww.status,
                user: ww.user,
                date: ww.date,
            })),
            ...holidayWorkings.filter(l=> [1, 4].includes(l.status.id)).map(hw => ({
                id: hw.id,
                type: 'holidayWorking',
                name: (hw.holiday?.name || 'Holiday') + ' Working',
                status: hw.status,
                user: hw.user,
                date: hw.holiday?.date,
            }))
        ];
    }, [leaves, weekendWorkings, holidayWorkings]);

    console.log();
    return (
        <>
            {header && <h1>Pending Approvals</h1>}
            {loading && <Loader/>}
            {!loading && !pendingApprovals?.length && <span>No pending approvals.</span>}
            {!loading && pendingApprovals &&
                <div className={'approvals-list app-scroll app-overflow-x'}>
                    {pendingApprovals.slice(0,4).map((approval, key) =>
                        <ApprovalItem key={key} approval={approval}/>
                    )}
                    {pendingApprovals.slice(4).length > 0 ?
                        pendingApprovals.slice(4).length === 1 ?
                            <ApprovalItem key={4} approval={pendingApprovals[4]}/> :
                            <div
                                className={'more-approvals app-clickable'}
                                onClick={() => navigate('/schedules/approvals')}
                            >
                                +{pendingApprovals.slice(4).length} more
                            </div> :
                        null
                    }
                </div>
            }
        </>
    );
};

const SchedulesDashboard = () => {
    return (
        <>
            <section className={'your-schedule'}>
                <YourSchedulePreview header/>
            </section>
            <section className={'your-team-schedule'}>
                <YourTeamSchedule header/>
            </section>
            <section className={'schedule-drafts'}>
                <SchedulesIndex header/>
            </section>
            <section className={'pending-approvals'}>
                <PendingApprovals header/>
            </section>
        </>
    );
};

export default SchedulesDashboard;