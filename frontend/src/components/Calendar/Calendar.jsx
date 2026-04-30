import { useMemo } from 'react';
import {
  getCalendarGridDays,
  formatDateKey,
  getMonthYearLabel,
} from '../../utils/calendarUtils.js';
import DayCell from '../DayCell/DayCell.jsx';
import styles from './Calendar.module.css';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar component – renders a monthly grid with navigation.
 *
 * Props:
 *  - month {Date}           Date object representing the displayed month
 *  - entries {Array}        Array of entry objects ({ date, sugarConsumed, … })
 *  - onDayClick {Function}  Callback invoked with a Date when a day is clicked
 *  - onPrevMonth {Function} Callback to navigate to the previous month
 *  - onNextMonth {Function} Callback to navigate to the next month
 */
export default function Calendar({
  month,
  entries = [],
  onDayClick,
  onPrevMonth,
  onNextMonth,
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // Build the grid once per month change
  const gridDays = useMemo(
    () => getCalendarGridDays(year, monthIndex),
    [year, monthIndex],
  );

  // Index entries by date string for O(1) lookup
  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((entry) => {
      map[entry.date] = entry;
    });
    return map;
  }, [entries]);

  /**
   * Find the entry (if any) for a given date.
   */
  function getEntryForDate(date) {
    return entryMap[formatDateKey(date)] || null;
  }

  /**
   * Determine whether a grid date belongs to the currently displayed month.
   */
  function isCurrentMonth(date) {
    return date.getMonth() === monthIndex && date.getFullYear() === year;
  }

  return (
    <div className={styles.calendar}>
      {/* Header with month navigation */}
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          ◀
        </button>

        <span className={styles.monthTitle}>{getMonthYearLabel(month)}</span>

        <button
          className={styles.navButton}
          onClick={onNextMonth}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>
        {gridDays.map((date) => {
          const key = formatDateKey(date);
          const today = new Date();
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

          return (
            <DayCell
              key={key}
              date={date}
              entry={getEntryForDate(date)}
              onClick={onDayClick}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth(date)}
            />
          );
        })}
      </div>
    </div>
  );
}
