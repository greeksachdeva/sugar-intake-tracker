/**
 * Calendar utility functions for computing month grids.
 */

/**
 * Returns the number of days in a given month/year.
 * Handles leap years correctly.
 *
 * @param {number} year - Full year (e.g. 2025)
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @returns {number} Number of days in the month
 */
export function getDaysInMonth(year, month) {
  // Day 0 of the *next* month gives the last day of the current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Builds an array of Date objects representing a full calendar grid for the
 * given month. The grid always starts on Sunday and ends on Saturday, so it
 * includes leading days from the previous month and trailing days from the
 * next month to fill complete weeks.
 *
 * @param {number} year - Full year
 * @param {number} month - 0-indexed month
 * @returns {Date[]} Array of Date objects covering the visible grid
 */
export function getCalendarGridDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const daysInMonth = getDaysInMonth(year, month);

  // Total cells needed: leading days + days in month, rounded up to full weeks
  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

  const days = [];

  for (let i = 0; i < totalCells; i++) {
    // offset from the 1st of the month
    const dayOffset = i - startDayOfWeek + 1;
    days.push(new Date(year, month, dayOffset));
  }

  return days;
}

/**
 * Formats a Date as a YYYY-MM-DD string (local time).
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks whether two dates fall on the same calendar day (local time).
 *
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns the month name and year for display, e.g. "January 2025".
 *
 * @param {Date} date
 * @returns {string}
 */
export function getMonthYearLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
