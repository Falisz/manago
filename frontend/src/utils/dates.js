// FRONTEND/utils/dates.js
export const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function generateDateList (fromDate, toDate, omitWeekends=false) {
    const dates = [];
    const startDate = new Date(fromDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setUTCHours(0, 0, 0, 0);

    while (startDate <= endDate) {
        if (omitWeekends && (startDate.getUTCDay() === 0 || startDate.getUTCDay() === 6)) {
            startDate.setUTCDate(startDate.getUTCDate() + 1);
            continue;
        }
        dates.push(new Date(startDate));
        startDate.setUTCDate(startDate.getUTCDate() + 1);
    }
    return dates;
}

export function formatDate (date) {
    if (!date)
        return null;

    if (typeof date === 'string')
        return date;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function sameDay (date1, date2) {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
}

export function getWeekNumber (date) {
    if (typeof date === 'string')
        date = new Date(date);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const year = date.getFullYear();
    const week1 = new Date(year, 0, 4);
    const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return [ week, year ];
}

export function getFirstDay (weekStr) {
    const [year, week] = weekStr.split('-W').map(Number);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay();
    const daysToMonday = (jan4Day - 1 + 7) % 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - daysToMonday);
    const startOfWeek = new Date(startOfWeek1);
    startOfWeek.setDate(startOfWeek1.getDate() + (week - 1) * 7);
    const y = startOfWeek.getFullYear();
    const m = String(startOfWeek.getMonth() + 1).padStart(2, '0');
    const d = String(startOfWeek.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}