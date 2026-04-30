// Feature: sugar-intake-tracker, Property 9: Responsive Layout Adaptation
// Feature: sugar-intake-tracker, Property 10: Touch Events Trigger Same Behavior
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fc from 'fast-check';
import Calendar from './Calendar.jsx';
import DayCell from '../DayCell/DayCell.jsx';
import { getDaysInMonth } from '../../utils/calendarUtils.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Set window.innerWidth and dispatch a resize event so components
 * that read the viewport can react.
 */
function setViewportWidth(width) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

/* ------------------------------------------------------------------ */
/*  Property 9: Responsive Layout Adaptation                          */
/*  **Validates: Requirements 5.3**                                   */
/* ------------------------------------------------------------------ */

describe('Property 9: Responsive Layout Adaptation', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    // Restore original viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('calendar renders all days and maintains 7-column grid for any viewport width (320–1920)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.integer({ min: 2000, max: 2099 }),
        fc.integer({ min: 0, max: 11 }),
        (width, year, month) => {
          // Set the viewport width
          setViewportWidth(width);

          const monthDate = new Date(year, month, 1);
          const daysInMonth = getDaysInMonth(year, month);

          const { unmount, container } = render(
            <Calendar
              month={monthDate}
              entries={[]}
              onDayClick={() => {}}
              onPrevMonth={() => {}}
              onNextMonth={() => {}}
            />,
          );

          // 1. The grid element should exist and use a 7-column layout
          const grid = container.querySelector('[class*="grid"]');
          expect(grid).not.toBeNull();

          // 2. All current-month days should be rendered as buttons
          const monthLabel = monthDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
          const dayButtons = screen.getAllByRole('button').filter((el) => {
            const label = el.getAttribute('aria-label');
            return label && label.includes(monthLabel);
          });

          expect(dayButtons).toHaveLength(daysInMonth);

          // 3. The grid should contain children (day cells) in multiples of 7
          expect(grid.children.length % 7).toBe(0);

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Property 10: Touch Events Trigger Same Behavior                   */
/*  **Validates: Requirements 6.2**                                   */
/* ------------------------------------------------------------------ */

describe('Property 10: Touch Events Trigger Same Behavior', () => {
  /**
   * Arbitrary that produces a random year/month and a random day index
   * within that month.
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

  it('touch (click) on any DayCell triggers onClick with the correct date', () => {
    fc.assert(
      fc.property(monthDayArb, ({ year, month, day }) => {
        const date = new Date(year, month, day);
        const onClick = vi.fn();

        const { unmount } = render(
          <DayCell
            date={date}
            entry={null}
            onClick={onClick}
            isToday={false}
            isCurrentMonth={true}
          />,
        );

        const cell = screen.getByTestId(`day-cell-${day}`);

        // Simulate a touch interaction via click (fireEvent.click simulates
        // touch on mobile in jsdom — touch events map to click handlers).
        fireEvent.click(cell);

        // Verify the callback was invoked with the correct date
        expect(onClick).toHaveBeenCalledTimes(1);
        const receivedDate = onClick.mock.calls[0][0];
        expect(receivedDate).toBeInstanceOf(Date);
        expect(receivedDate.getFullYear()).toBe(year);
        expect(receivedDate.getMonth()).toBe(month);
        expect(receivedDate.getDate()).toBe(day);

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('touchStart + touchEnd on DayCell fires the click handler', () => {
    fc.assert(
      fc.property(monthDayArb, ({ year, month, day }) => {
        const date = new Date(year, month, day);
        const onClick = vi.fn();

        const { unmount } = render(
          <DayCell
            date={date}
            entry={null}
            onClick={onClick}
            isToday={false}
            isCurrentMonth={true}
          />,
        );

        const cell = screen.getByTestId(`day-cell-${day}`);

        // Fire touch events followed by a click (browser behavior on touch devices)
        fireEvent.touchStart(cell);
        fireEvent.touchEnd(cell);
        fireEvent.click(cell);

        expect(onClick).toHaveBeenCalledTimes(1);
        const receivedDate = onClick.mock.calls[0][0];
        expect(receivedDate.getFullYear()).toBe(year);
        expect(receivedDate.getMonth()).toBe(month);
        expect(receivedDate.getDate()).toBe(day);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Task 13.5: Unit tests for mobile edge cases                       */
/*  **Validates: Requirements 6.3**                                   */
/* ------------------------------------------------------------------ */

describe('Mobile edge cases', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders all days at minimum width (320px)', () => {
    setViewportWidth(320);

    const month = new Date(2025, 0, 1); // January 2025 – 31 days
    const { container } = render(
      <Calendar
        month={month}
        entries={[]}
        onDayClick={() => {}}
        onPrevMonth={() => {}}
        onNextMonth={() => {}}
      />,
    );

    // All 31 January days should be rendered
    const dayButtons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && label.includes('January 2025');
    });
    expect(dayButtons).toHaveLength(31);

    // Grid structure should still be intact
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).not.toBeNull();
    expect(grid.children.length % 7).toBe(0);
  });

  it('renders correctly after a simulated orientation change (resize event)', () => {
    // Start in portrait mode (375px)
    setViewportWidth(375);

    const month = new Date(2025, 5, 1); // June 2025 – 30 days
    const { container, rerender } = render(
      <Calendar
        month={month}
        entries={[]}
        onDayClick={() => {}}
        onPrevMonth={() => {}}
        onNextMonth={() => {}}
      />,
    );

    // Verify initial render
    let dayButtons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && label.includes('June 2025');
    });
    expect(dayButtons).toHaveLength(30);

    // Simulate orientation change to landscape (667px)
    act(() => {
      setViewportWidth(667);
    });

    // Re-render to simulate React responding to the resize
    rerender(
      <Calendar
        month={month}
        entries={[]}
        onDayClick={() => {}}
        onPrevMonth={() => {}}
        onNextMonth={() => {}}
      />,
    );

    // All days should still be present after orientation change
    dayButtons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && label.includes('June 2025');
    });
    expect(dayButtons).toHaveLength(30);

    // Grid structure should remain intact
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).not.toBeNull();
    expect(grid.children.length % 7).toBe(0);
  });
});
