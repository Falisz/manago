// BACKEND/controller/workPlanner/AbsenceBalance.js
import {Op} from 'sequelize';
import {
    Absence,
    AbsenceBalance,
    AbsenceType,
    Holiday,
    HolidayWorking,
    TimeRecord,
    User,
    WeekendWorking
} from '#models';


// TODO: Fix the calculations.
/**
 * Retrieves Absence Balance for specified userId, absenceTypeId and year.
 * @param userId
 * @param typeId
 * @param year
 * @param recursiveBlock
 * @returns {Promise<{totalBalance: *, usedBalance: *, availableBalance: *, collectedDates: *, compensatedDates: *, availableDates: *}|{}>}
 */
export async function getAbsenceBalance({userId, typeId, year, recursiveBlock = false} = {}) {
    if (!userId || !typeId || !year)
        return {};

    const balance = await AbsenceBalance.findOne({ where: { user: userId, type: typeId, year }, raw: true });

    if (!balance)
        return await updateAbsenceBalance({userId, typeId, year, recursiveBlock});

    return balance;
}

export async function updateAbsenceBalance({userId, typeId, year, recursiveBlock} = {}) {
    if (!userId || !typeId)
        return {};
    const user = await User.findByPk(userId, { attributes: ['id', 'joined', 'notice_start'], raw: true });
    const leave = await AbsenceType.findByPk(typeId, { raw: true });
    if (!user || !leave)
        return {};

    let totalBalance;
    let usedBalance;
    let availableBalance;

    let collectedDates;
    let compensatedDates;
    let availableDates;

    // Logic for all absences different from Comp Offs
    if (leave.id !== 100) {
        totalBalance = leave.amount;

        if (leave.amount && leave.scaled) {
            let months = 12;
            if (user.joined) {
                const joinDate = new Date(user.joined);
                if (!isNaN(joinDate) && joinDate.getFullYear() === year)
                    months -= (joinDate.getMonth());
            }
            if (user.notice_start) {
                const noticeDate = new Date(user.notice_start)
                if (!isNaN(noticeDate) && noticeDate.getFullYear() === year)
                    months -= (12 - noticeDate.getMonth() - 1);
            }
            months = Math.max(0, Math.min(12, months));
            totalBalance = Math.ceil(totalBalance*(months/12));
        }

        if (leave.amount && leave.parent_type) {
            const {availableBalance: parentBalance} = await getAbsenceBalance({
                userId: user.id,
                typeId: leave.parent_type,
                year
            });
            if (parentBalance != null)
                totalBalance = Math.min(totalBalance, parentBalance);
        }

        if (!recursiveBlock && leave.amount && leave.transferable) {
            if (leave.amount) {
                const limitYear = user.joined ? new Date(user.joined).getFullYear() : new Date().getFullYear();

                for (let yr = year - 1; yr >= limitYear; yr--) {
                    const {availableBalance: remainingBalance} = await getAbsenceBalance({
                        userId: user.id,
                        typeId: leave.id,
                        year: yr,
                        recursiveBlock: true
                    });
                    if (remainingBalance != null)
                        totalBalance += remainingBalance;
                }
            }
        }
        // Logic for Comp Offs
    } else {
        totalBalance = 0;

        const approvedHolidays = await Holiday.findAll({
            include: [{
                model: HolidayWorking,                     // Search for approved Holidays with HolidayWorking
                where: { user: user.id, status: [2, 4] },  // Only approved Holidays
                required: true,                            // Only Holidays with HolidayWorking approved
                attributes: []                             // No attributes for HolidayWorking needed
            }],
            attributes: ['date'],
            raw: true
        });
        const approvedHolidayDates = approvedHolidays.map(h => h.date);
        const approvedWeekends = await WeekendWorking.findAll({
            where: { user: user.id, status: [2, 4] },
            attributes: ['date'],
            raw: true
        });
        const approvedWeekendDates = approvedWeekends.map(h => h.date);
        const approvedDates = [...approvedHolidayDates, ...approvedWeekendDates];

        const approvedTimeSheets = await TimeRecord.findAll({
            where: {
                user: user.id,                             // TimeRecords for user
                date: approvedDates,                       // On Approved Holidays
                status: 2                                  // Approved TimeRecords
            },
            raw: true
        });
        const datesWorked = approvedTimeSheets.map(w => w.date);

        collectedDates = approvedDates.filter(h => datesWorked.includes(h.date)) || [];
        totalBalance = collectedDates.length;
    }

    const type = [leave.id];

    if (leave.id !== 100) {
        const subTypes = await AbsenceType.findAll({ where: { parent_type: leave.id }, raw: true });
        type.push(...subTypes.map(l => l.id));
    }

    const absences = await Absence.findAll({
        where: {
            user: user.id,
            status: [0, 1, 2, 4],
            type,
            start_date: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` }
        },
        raw: true
    });

    if (leave.id !== 100) {
        usedBalance = absences?.reduce((sum, leave) => sum + (Number(leave.days) || 0), 0) || 0;
        availableBalance = totalBalance ? totalBalance - usedBalance : null;
    } else {
        compensatedDates = absences.map(l => l.start_date) || [];
        usedBalance = compensatedDates.length;

        availableDates = collectedDates?.filter(d => !compensatedDates.includes(d)) || [];
        availableBalance = Math.max(0, totalBalance - usedBalance);
    }

    const balance = await AbsenceBalance.findOne({where: { user: userId, type: typeId, year }});
    if (balance)
        await balance.update({totalBalance, usedBalance, availableBalance, collectedDates, compensatedDates, availableDates});
    else
        await AbsenceBalance.create({
            user: userId, type: typeId, year: year,
            totalBalance, usedBalance, availableBalance, collectedDates, compensatedDates, availableDates
        });

    return {totalBalance, usedBalance, availableBalance, collectedDates, compensatedDates, availableDates};
}