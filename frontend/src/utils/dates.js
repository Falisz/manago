// FRONTEND/utils/dates.js

export function generateDateList (fromDate, toDate, omitWeekends=false) {
    const dates = [];
    const currentDate = new Date(fromDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        if (omitWeekends && (currentDate.getUTCDay() === 0 || currentDate.getUTCDay() === 6)) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            continue;
        }
        dates.push(new Date(currentDate));
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

export function formatTime (date) {
    return new Date(date).toLocaleTimeString(
        'pl-PL',
        { hour: '2-digit', minute: '2-digit', hour12: false,}
    );
}

export function sameDay (date1, date2) {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
}

export function toUTCDate (s) {
    return new Date(`${s}T00:00:00`);
}