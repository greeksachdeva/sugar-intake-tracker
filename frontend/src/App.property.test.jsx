// Feature: sugar-intake-tracker, Property 6: Historical Data Navigation
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import Calendar from './components/Calendar/Calendar.jsx';
import { getDaysInMonth, formatDateKey } from './utils/calendarUtils.js';

/**
 * **Validates: Requirements 3.2**
 *
 * Property 6: Historical Data Navigation
 * For any month with stored entries, when the user navigates to that month,
 * all entries for that month should be displayed in the calendar.
 *
 * We test this by rendering the Calendar component directly with a random
 * month and a random set of entries for that month, then verifying that
 * every entry is displayed with the correct emoji on the correct day.
 */
describe('Property 6: Historical Data Navigation', () => {
  /**
   * Arbitrary that produces a random year/month and a random set of entries
   * for days within that month. Each entry has a unique day and a random
   * sugarConsumed boolean.
   */
  const monthWithEntriesArb = fc
    .integer({ min: 2000, max: 2099 })
    .chain((year) =>
      fc.integer({ min: 0, max: 11 }).chain((month) => {
        const daysInMonth = getDaysInMonth(year, month);

        // Generate a unique set of days (1..daysInMonth) with random sugar status
        const entriesArb = fc
          .uniqueArray(fc.integer({ min: 1, max: daysInMonth }), {
            minLength: 1,
            maxLength: Math.min(daysInMonth, 15),
          })
          .chain((days) =>
            fc
              .array(fc.boolean(), {
                minLength: days.length,
                maxLength: days.length,
              })
              .map((booleans) =>
                days.map((day, i) => {
                  const m = String(month + 1).padStart(2, '0');
                  const d = String(day).padStart(2, '0');
                  return {
                    date: `${year}-${m}-${d}`,
                    sugarConsumed: booleans[i],
                    day,
                  };
                }),
              ),
          );

        return entriesArb.map((entries) => ({ year, month, entries }));
      }),
    );

  it('all entries for a given month are displayed in the calendar with correct emojis', () => {
    fc.assert(
      fc.property(monthWithEntriesArb, ({ year, month, entries }) => {
        const monthDate = new Date(year, month, 1);

        // Entries as the Calendar expects them (without the helper `day` field)
        const calendarEntries = entries.map(({ date, sugarConsumed }) => ({
          date,
          sugarConsumed,
        }));

        const { unmount } = render(
          <Calendar
            month={monthDate}
            entries={calendarEntries}
            onDayClick={() => {}}
            onPrevMonth={() => {}}
            onNextMonth={() => {}}
          />,
        );

        // Verify every generated entry is displayed with the correct emoji
        for (const entry of entries) {
          const monthLabel = monthDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });

          // DayCell aria-label format: "{day} {Month Year} - sugar consumed" or "- no sugar"
          const expectedSuffix = entry.sugarConsumed
            ? ' - sugar consumed'
            : ' - no sugar';
          const labelPattern = new RegExp(
            `^${entry.day} ${monthLabel}${expectedSuffix}$`,
          );

          const dayElement = screen.getByLabelText(labelPattern);
          expect(dayElement).toBeTruthy();

          // Verify the correct emoji is rendered inside the day cell
          const expectedEmoji = entry.sugarConsumed ? '😔' : '😊';
          expect(dayElement.textContent).toContain(expectedEmoji);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
