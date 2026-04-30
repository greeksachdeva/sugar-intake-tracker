// Feature: sugar-intake-tracker, Property 7: Day Click Triggers Update Dialog
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import Calendar from './Calendar.jsx';
import { getDaysInMonth } from '../../utils/calendarUtils.js';

/**
 * **Validates: Requirements 3.1**
 *
 * Property 7: Day Click Triggers Update Dialog
 * For any clickable day in the calendar (past or present), clicking that day
 * should trigger the update dialog with the correct date.
 */
describe('Property 7: Day Click Triggers Update Dialog', () => {
  /**
   * Arbitrary that produces a random year/month and a random day index
   * within that month. Constrained to a reasonable range.
   */
  const monthDayArb = fc
    .integer({ min: 2000, max: 2099 })
    .chain((year) =>
      fc.integer({ min: 0, max: 11 }).chain((month) => {
        const daysInMonth = getDaysInMonth(year, month);
        return fc
          .integer({ min: 1, max: daysInMonth })
          .map((day) => ({ year, month, day }));
      }),
    );

  it('clicking any current-month day calls onDayClick with the correct date', async () => {
    await fc.assert(
      fc.asyncProperty(monthDayArb, async ({ year, month, day }) => {
        const monthDate = new Date(year, month, 1);
        const onDayClick = vi.fn();
        const user = userEvent.setup();

        const { unmount } = render(
          <Calendar
            month={monthDate}
            entries={[]}
            onDayClick={onDayClick}
            onPrevMonth={() => {}}
            onNextMonth={() => {}}
          />,
        );

        // Build the expected aria-label pattern for the target day.
        // The Calendar renders DayCell components whose aria-label starts
        // with "{day} {monthName} {year}" for current-month days.
        const monthName = monthDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        const labelPattern = new RegExp(`^${day} ${monthName}`);

        const dayButton = screen.getByLabelText(labelPattern);
        await user.click(dayButton);

        // Verify onDayClick was called exactly once
        expect(onDayClick).toHaveBeenCalledTimes(1);

        // Verify the callback received a Date object with the correct values
        const clickedDate = onDayClick.mock.calls[0][0];
        expect(clickedDate).toBeInstanceOf(Date);
        expect(clickedDate.getFullYear()).toBe(year);
        expect(clickedDate.getMonth()).toBe(month);
        expect(clickedDate.getDate()).toBe(day);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
