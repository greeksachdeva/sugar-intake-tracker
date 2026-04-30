import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayCell from './DayCell.jsx';

describe('DayCell', () => {
  const baseDate = new Date(2025, 0, 15); // January 15, 2025

  it('renders the day number', () => {
    render(<DayCell date={baseDate} />);
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('shows happy emoji for no-sugar entries', () => {
    const entry = { date: '2025-01-15', sugarConsumed: false };
    render(<DayCell date={baseDate} entry={entry} />);
    expect(screen.getByText('😊')).toBeTruthy();
  });

  it('shows sad emoji for sugar-consumed entries', () => {
    const entry = { date: '2025-01-15', sugarConsumed: true };
    render(<DayCell date={baseDate} entry={entry} />);
    expect(screen.getByText('😔')).toBeTruthy();
  });

  it('shows no emoji for days without entries', () => {
    render(<DayCell date={baseDate} entry={null} />);
    expect(screen.queryByText('😊')).toBeNull();
    expect(screen.queryByText('😔')).toBeNull();
  });

  it('calls onClick with the date when clicked', async () => {
    const onClick = vi.fn();
    render(
      <DayCell date={baseDate} onClick={onClick} isCurrentMonth={true} />,
    );
    const cell = screen.getByRole('button');
    await userEvent.click(cell);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(baseDate);
  });

  it('does not call onClick for other-month days', async () => {
    const onClick = vi.fn();
    render(
      <DayCell date={baseDate} onClick={onClick} isCurrentMonth={false} />,
    );
    // Other-month cells have no role="button", so click the test-id element
    const cell = screen.getByTestId('day-cell-15');
    await userEvent.click(cell);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies today styling when isToday is true', () => {
    render(<DayCell date={baseDate} isToday={true} />);
    const cell = screen.getByRole('button');
    expect(cell.className).toContain('today');
  });

  it('does not apply today styling when isToday is false', () => {
    render(<DayCell date={baseDate} isToday={false} />);
    const cell = screen.getByRole('button');
    expect(cell.className).not.toContain('today');
  });

  it('triggers onClick on Enter key press', async () => {
    const onClick = vi.fn();
    render(
      <DayCell date={baseDate} onClick={onClick} isCurrentMonth={true} />,
    );
    const cell = screen.getByRole('button');
    cell.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(baseDate);
  });

  it('triggers onClick on Space key press', async () => {
    const onClick = vi.fn();
    render(
      <DayCell date={baseDate} onClick={onClick} isCurrentMonth={true} />,
    );
    const cell = screen.getByRole('button');
    cell.focus();
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(baseDate);
  });

  it('includes entry status in aria-label for no-sugar entry', () => {
    const entry = { date: '2025-01-15', sugarConsumed: false };
    render(<DayCell date={baseDate} entry={entry} isCurrentMonth={true} />);
    const cell = screen.getByRole('button');
    expect(cell.getAttribute('aria-label')).toContain('no sugar');
  });

  it('includes entry status in aria-label for sugar-consumed entry', () => {
    const entry = { date: '2025-01-15', sugarConsumed: true };
    render(<DayCell date={baseDate} entry={entry} isCurrentMonth={true} />);
    const cell = screen.getByRole('button');
    expect(cell.getAttribute('aria-label')).toContain('sugar consumed');
  });
});
