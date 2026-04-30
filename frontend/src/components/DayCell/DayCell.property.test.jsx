// Feature: sugar-intake-tracker, Property 5: Visual Feedback Matches Entry Status
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import DayCell from './DayCell.jsx';

/**
 * **Validates: Requirements 2.2, 2.3, 2.4**
 *
 * Property 5: Visual Feedback Matches Entry Status
 * For any calendar day with an entry, the rendered day cell should display:
 * - Green background or happy emoji when sugarConsumed is false
 * - Sad emoji when sugarConsumed is true
 * - Neutral styling when no entry exists
 */
describe('Property 5: Visual Feedback Matches Entry Status', () => {
  /**
   * Arbitrary that produces a valid Date object for a random day.
   * Constrained to a reasonable range to avoid edge-case Date issues.
   */
  const dateArb = fc
    .integer({ min: 2000, max: 2099 })
    .chain((year) =>
      fc
        .integer({ min: 0, max: 11 })
        .chain((month) =>
          fc
            .integer({ min: 1, max: 28 })
            .map((day) => new Date(year, month, day)),
        ),
    );

  it('displays happy emoji (😊) and noSugar class when sugarConsumed is false', () => {
    fc.assert(
      fc.property(dateArb, (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const entry = { date: dateStr, sugarConsumed: false };

        const { unmount } = render(
          <DayCell date={date} entry={entry} isCurrentMonth={true} />,
        );

        // Requirement 2.2: no-sugar days show happy emoji / green
        const emoji = screen.getByText('😊');
        expect(emoji).toBeTruthy();

        // Verify the noSugar CSS class is applied
        const cell = screen.getByTestId(`day-cell-${date.getDate()}`);
        expect(cell.className).toContain('noSugar');
        expect(cell.className).not.toContain('sugarConsumed');
        expect(cell.className).not.toContain('noEntry');

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('displays sad emoji (😔) and sugarConsumed class when sugarConsumed is true', () => {
    fc.assert(
      fc.property(dateArb, (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const entry = { date: dateStr, sugarConsumed: true };

        const { unmount } = render(
          <DayCell date={date} entry={entry} isCurrentMonth={true} />,
        );

        // Requirement 2.3: sugar-consumed days show sad emoji
        const emoji = screen.getByText('😔');
        expect(emoji).toBeTruthy();

        // Verify the sugarConsumed CSS class is applied
        const cell = screen.getByTestId(`day-cell-${date.getDate()}`);
        expect(cell.className).toContain('sugarConsumed');
        expect(cell.className).not.toContain('noSugar');
        expect(cell.className).not.toContain('noEntry');

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('displays no emoji and noEntry class when no entry exists', () => {
    fc.assert(
      fc.property(dateArb, (date) => {
        const { unmount } = render(
          <DayCell date={date} entry={null} isCurrentMonth={true} />,
        );

        // Requirement 2.4: days without entries show neutral state
        expect(screen.queryByText('😊')).toBeNull();
        expect(screen.queryByText('😔')).toBeNull();

        // Verify the noEntry CSS class is applied
        const cell = screen.getByTestId(`day-cell-${date.getDate()}`);
        expect(cell.className).toContain('noEntry');
        expect(cell.className).not.toContain('noSugar');
        expect(cell.className).not.toContain('sugarConsumed');

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('visual feedback is consistent for any date and boolean sugarConsumed value', () => {
    fc.assert(
      fc.property(dateArb, fc.boolean(), (date, sugarConsumed) => {
        const dateStr = date.toISOString().split('T')[0];
        const entry = { date: dateStr, sugarConsumed };

        const { unmount } = render(
          <DayCell date={date} entry={entry} isCurrentMonth={true} />,
        );

        const cell = screen.getByTestId(`day-cell-${date.getDate()}`);

        if (sugarConsumed) {
          // Sugar consumed → sad emoji + sugarConsumed class
          expect(screen.getByText('😔')).toBeTruthy();
          expect(screen.queryByText('😊')).toBeNull();
          expect(cell.className).toContain('sugarConsumed');
        } else {
          // No sugar → happy emoji + noSugar class
          expect(screen.getByText('😊')).toBeTruthy();
          expect(screen.queryByText('😔')).toBeNull();
          expect(cell.className).toContain('noSugar');
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
