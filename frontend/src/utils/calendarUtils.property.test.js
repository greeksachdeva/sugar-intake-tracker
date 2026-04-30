// Feature: sugar-intake-tracker, Property 4: Calendar Displays Correct Day Count
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getDaysInMonth, getCalendarGridDays } from './calendarUtils.js';

/**
 * **Validates: Requirements 2.1**
 *
 * Property 4: Calendar Displays Correct Day Count
 * For any month and year, the calendar should render exactly the number of
 * days that exist in that month (accounting for leap years).
 */
describe('Property 4: Calendar Displays Correct Day Count', () => {
  it('getCalendarGridDays contains exactly the correct number of days for any month', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1970, max: 2100 }), // year
        fc.integer({ min: 0, max: 11 }), // month (0-indexed)
        (year, month) => {
          const expectedDays = getDaysInMonth(year, month);
          const gridDays = getCalendarGridDays(year, month);

          // Filter grid days to only those belonging to the target month
          const monthDays = gridDays.filter(
            (d) => d.getFullYear() === year && d.getMonth() === month,
          );

          expect(monthDays).toHaveLength(expectedDays);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('February has 29 days in leap years and 28 in non-leap years', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1970, max: 2100 }), // year
        (year) => {
          const month = 1; // February
          const isLeapYear =
            (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
          const expectedFebDays = isLeapYear ? 29 : 28;

          const gridDays = getCalendarGridDays(year, month);
          const febDays = gridDays.filter(
            (d) => d.getFullYear() === year && d.getMonth() === month,
          );

          expect(febDays).toHaveLength(expectedFebDays);
        },
      ),
      { numRuns: 100 },
    );
  });
});
