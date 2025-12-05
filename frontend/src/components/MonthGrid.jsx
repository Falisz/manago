// FRONTEND/components/MonthGrid.jsx
import React from 'react';
import '../styles/MonthGrid.css';
import useNav from "../contexts/NavContext";

function MonthGrid({ date, selectedDates, setSelectedDate, items, startDay = 1 }) {
    // Parse the date string (e.g., "December 05, 2025")

    const { openDialog } = useNav();

    if (!date)
        return null;

    date = new Date(date);
    const month = date.getMonth(); // 0-based (0=Jan, 11=Dec)
    const year = date.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerDays = [...weekdays.slice(startDay), ...weekdays.slice(0, startDay)];
    const offset = (firstWeekday - startDay + 7) % 7;
    const rows = Math.ceil((offset + daysInMonth) / 7);

    return (
        <table className={'month-grid'}>
            <thead>
                <tr>
                    {headerDays.map((day) => (
                        <th key={day} className={['Sun', 'Sat'].includes(day) ? 'weekend' : 'weekday'} title={day}>
                            {day}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
            {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {[...Array(7)].map((_, colIndex) => {
                        const cellIndex = rowIndex * 7 + colIndex;
                        let dayNumber;
                        let cellMonth = month;
                        let cellYear = year;
                        let isCurrentMonth = true

                        if (cellIndex < offset) {
                            // Previous month
                            dayNumber = daysInPrevMonth - offset + cellIndex + 1;
                            cellMonth = month - 1;
                            if (cellMonth < 0) {
                                cellMonth = 11;
                                cellYear -= 1;
                            }
                            isCurrentMonth = false;
                        } else if (cellIndex < offset + daysInMonth) {
                            // Current month
                            dayNumber = cellIndex - offset + 1;
                        } else {
                            // Next month
                            dayNumber = cellIndex - offset - daysInMonth + 1;
                            cellMonth = month + 1;
                            if (cellMonth > 11) {
                                cellMonth = 0;
                                cellYear += 1;
                            }
                            isCurrentMonth = false;
                        }

                        const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                        const selected = selectedDates?.has(dateStr);
                        const item = items?.[dateStr];

                        let numberTitle, color, onClick = () => setSelectedDate(dateStr);
                        if (item?.item_type === 'leave') {
                            numberTitle = item.type?.name + ' | ' + item.status?.name;
                            color = item.type?.color;
                            onClick = () => openDialog(
                                {content: 'leaveDetails', contentId: item.id, closeButton: false}
                            );
                        }

                        return (
                            <td
                                key={colIndex}
                                data-date={dateStr}
                                className={
                                    (isCurrentMonth ? 'current-month' : 'other-month') +
                                    (item ? ' has-item' : ' empty') +
                                    (selected ? ' selected' : '')
                                }
                            >
                                <div
                                    className={'day-number'}
                                    style={{background: color, cursor: 'pointer'}}
                                    title={numberTitle}
                                    onClick={onClick}
                                >
                                    {dayNumber}
                                </div>
                            </td>
                        );
                    })}
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default MonthGrid;