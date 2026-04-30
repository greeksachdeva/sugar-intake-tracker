import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar.jsx';
import { getDaysInMonth } from '../../utils/calendarUtils.js';

describe('Calendar', () => {
  const defaultMonth = new Date(2025, 0, 1); // January 2025

  it('renders the month and year title', () => {
    render(<Calendar month={defaultMonth} entries={[]} />);
    expect(screen.getByText('January 2025')).toBeTruthy();
  });

  it('renders weekday headers', () => {
    render(<Calendar month={defaultMonth} entries={[]} />);
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day) => {
      expect(screen.getByText(day)).toBeTruthy();
    });
  });

  it('renders previous and next navigation buttons', () => {
    render(<Calendar month={defaultMonth} entries={[]} />);
    expect(screen.getByLabelText('Previous month')).toBeTruthy();
    expect(screen.getByLabelText('Next month')).toBeTruthy();
  });

  it('calls onPrevMonth when previous button is clicked', async () => {
    const onPrev = vi.fn();
    render(
      <Calendar month={defaultMonth} entries={[]} onPrevMonth={onPrev} />,
    );
    await userEvent.click(screen.getByLabelText('Previous month'));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button is clicked', async () => {
    const onNext = vi.fn();
    render(
      <Calendar month={defaultMonth} entries={[]} onNextMonth={onNext} />,
    );
    await userEvent.click(screen.getByLabelText('Next month'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders all 31 days of January 2025 in the grid', () => {
    render(<Calendar month={defaultMonth} entries={[]} />);
    // January 2025 has days 1-31. Check a few key ones via aria-label.
    for (const day of [1, 15, 31]) {
      expect(screen.getByLabelText(new RegExp(`^${day} January 2025`))).toBeTruthy();
    }
  });

  it('calls onDayClick with the correct date when a day is clicked', async () => {
    const onDayClick = vi.fn();
    render(
      <Calendar
        month={defaultMonth}
        entries={[]}
        onDayClick={onDayClick}
      />,
    );
    // Click on day 15
    const day15 = screen.getByLabelText(/^15 January 2025/);
    await userEvent.click(day15);
    expect(onDayClick).toHaveBeenCalledTimes(1);
    const clickedDate = onDayClick.mock.calls[0][0];
    expect(clickedDate.getDate()).toBe(15);
    expect(clickedDate.getMonth()).toBe(0);
    expect(clickedDate.getFullYear()).toBe(2025);
  });

  it('renders February 2024 with 29 days (leap year)', () => {
    const feb2024 = new Date(2024, 1, 1);
    render(<Calendar month={feb2024} entries={[]} />);
    expect(screen.getByLabelText(/^29 February 2024/)).toBeTruthy();
  });

  it('renders February 2023 with 28 days (non-leap year)', () => {
    const feb2023 = new Date(2023, 1, 1);
    render(<Calendar month={feb2023} entries={[]} />);
    expect(screen.getByLabelText(/^28 February 2023/)).toBeTruthy();
    // Day 29 should not be in February
    const allLabels = screen
      .getAllByRole('button')
      .map((el) => el.getAttribute('aria-label'));
    const feb29Label = allLabels.find((l) => l && l.startsWith('29 February 2023'));
    expect(feb29Label).toBeUndefined();
  });
});

describe('Calendar – edge cases', () => {
  // Validates: Requirements 2.1, 2.4

  it('renders all days with neutral styling when there are no entries', () => {
    const month = new Date(2025, 0, 1); // January 2025
    render(<Calendar month={month} entries={[]} />);

    // Every current-month day should be a button (clickable) with no emoji
    const buttons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && /January 2025/.test(label);
    });

    // January has 31 days
    expect(buttons).toHaveLength(31);

    // None of the day cells should contain an emoji
    buttons.forEach((btn) => {
      expect(btn.textContent).not.toContain('😊');
      expect(btn.textContent).not.toContain('😔');
    });
  });

  it('shows an emoji on every day when all days have entries', () => {
    const month = new Date(2025, 2, 1); // March 2025 – 31 days
    const daysInMonth = getDaysInMonth(2025, 2);
    const entries = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      entries.push({
        date: `2025-03-${dd}`,
        sugarConsumed: d % 2 === 0, // alternate
      });
    }

    render(<Calendar month={month} entries={entries} />);

    const dayButtons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && /March 2025/.test(label);
    });

    expect(dayButtons).toHaveLength(31);

    dayButtons.forEach((btn) => {
      const text = btn.textContent;
      const hasEmoji = text.includes('😊') || text.includes('😔');
      expect(hasEmoji).toBe(true);
    });
  });

  it('renders leading empty cells for January 2025 that are not clickable', () => {
    // January 2025 starts on Wednesday (index 3), so Sun/Mon/Tue are from December 2024
    const month = new Date(2025, 0, 1);
    const onDayClick = vi.fn();
    render(<Calendar month={month} entries={[]} onDayClick={onDayClick} />);

    // The grid container holds all day cells (current month + overflow)
    const grid = document.querySelector('[class*="grid"]');
    const allCells = grid.children;

    // First 3 cells should be from December 2024 (leading days)
    for (let i = 0; i < 3; i++) {
      const cell = allCells[i];
      // They should NOT have role="button" (not clickable)
      expect(cell.getAttribute('role')).toBeNull();
      // They should NOT have an aria-label (DayCell sets it to undefined for other-month)
      expect(cell.getAttribute('aria-label')).toBeNull();
    }

    // The 4th cell (index 3) should be January 1
    const jan1 = allCells[3];
    expect(jan1.getAttribute('role')).toBe('button');
    expect(jan1.getAttribute('aria-label')).toMatch(/^1 January 2025/);
  });

  it('displays entries correctly on the first and last day of the month', () => {
    const month = new Date(2025, 3, 1); // April 2025 – 30 days
    const entries = [
      { date: '2025-04-01', sugarConsumed: false },
      { date: '2025-04-30', sugarConsumed: true },
    ];

    render(<Calendar month={month} entries={entries} />);

    const day1 = screen.getByLabelText(/^1 April 2025/);
    expect(day1.textContent).toContain('😊');

    const day30 = screen.getByLabelText(/^30 April 2025/);
    expect(day30.textContent).toContain('😔');
  });

  it('renders February 2024 (leap year) with exactly 29 days', () => {
    const month = new Date(2024, 1, 1);
    render(<Calendar month={month} entries={[]} />);

    const febButtons = screen.getAllByRole('button').filter((el) => {
      const label = el.getAttribute('aria-label');
      return label && /February 2024/.test(label);
    });

    expect(febButtons).toHaveLength(29);
    // Verify day 29 exists
    expect(screen.getByLabelText(/^29 February 2024/)).toBeTruthy();
  });

  it('navigates from December to January across a year boundary', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    // Start at December 2025
    const { rerender } = render(
      <Calendar
        month={new Date(2025, 11, 1)}
        entries={[]}
        onPrevMonth={onPrev}
        onNextMonth={onNext}
      />,
    );

    expect(screen.getByText('December 2025')).toBeTruthy();

    // Click next month
    await userEvent.click(screen.getByLabelText('Next month'));
    expect(onNext).toHaveBeenCalledTimes(1);

    // Simulate the parent updating the month prop to January 2026
    rerender(
      <Calendar
        month={new Date(2026, 0, 1)}
        entries={[]}
        onPrevMonth={onPrev}
        onNextMonth={onNext}
      />,
    );

    expect(screen.getByText('January 2026')).toBeTruthy();

    // Navigate back to December 2025
    await userEvent.click(screen.getByLabelText('Previous month'));
    expect(onPrev).toHaveBeenCalledTimes(1);

    rerender(
      <Calendar
        month={new Date(2025, 11, 1)}
        entries={[]}
        onPrevMonth={onPrev}
        onNextMonth={onNext}
      />,
    );

    expect(screen.getByText('December 2025')).toBeTruthy();
  });
});
