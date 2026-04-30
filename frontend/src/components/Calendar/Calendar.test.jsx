import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar.jsx';

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
