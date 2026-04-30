import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  getCalendarGridDays,
  formatDateKey,
  isSameDay,
  getMonthYearLabel,
} from './calendarUtils.js';

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(getDaysInMonth(2023, 1)).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2025, 3)).toBe(30);
  });

  it('handles century non-leap year (1900)', () => {
    expect(getDaysInMonth(1900, 1)).toBe(28);
  });

  it('handles century leap year (2000)', () => {
    expect(getDaysInMonth(2000, 1)).toBe(29);
  });
});

describe('getCalendarGridDays', () => {
  it('returns an array whose length is a multiple of 7', () => {
    const days = getCalendarGridDays(2025, 0); // January 2025
    expect(days.length % 7).toBe(0);
  });

  it('starts on a Sunday', () => {
    const days = getCalendarGridDays(2025, 0);
    expect(days[0].getDay()).toBe(0); // Sunday
  });

  it('ends on a Saturday', () => {
    const days = getCalendarGridDays(2025, 0);
    expect(days[days.length - 1].getDay()).toBe(6); // Saturday
  });

  it('contains all days of the month', () => {
    const year = 2025;
    const month = 0; // January
    const days = getCalendarGridDays(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    const monthDays = days.filter(
      (d) => d.getMonth() === month && d.getFullYear() === year,
    );
    expect(monthDays.length).toBe(daysInMonth);
  });

  it('handles February leap year correctly', () => {
    const days = getCalendarGridDays(2024, 1);
    const febDays = days.filter(
      (d) => d.getMonth() === 1 && d.getFullYear() === 2024,
    );
    expect(febDays.length).toBe(29);
  });
});

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateKey(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  it('pads single-digit months and days', () => {
    expect(formatDateKey(new Date(2025, 2, 3))).toBe('2025-03-03');
  });
});

describe('isSameDay', () => {
  it('returns true for the same calendar day', () => {
    const a = new Date(2025, 5, 15, 10, 30);
    const b = new Date(2025, 5, 15, 22, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for different days', () => {
    const a = new Date(2025, 5, 15);
    const b = new Date(2025, 5, 16);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe('getMonthYearLabel', () => {
  it('returns a human-readable month and year', () => {
    const label = getMonthYearLabel(new Date(2025, 0, 1));
    expect(label).toBe('January 2025');
  });
});
