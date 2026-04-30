import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import apiClient from './services/apiClient.js';

/**
 * Integration tests for complete user flows through the App component.
 * Validates: Requirements 1.2, 2.1, 3.1, 3.2
 */

vi.mock('./services/apiClient.js', () => ({
  default: {
    getEntries: vi.fn(),
    getImages: vi.fn(),
    updateEntry: vi.fn(),
    createEntry: vi.fn(),
  },
}));

// ── Helpers ─────────────────────────────────────────────────

const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

function pad(n) {
  return String(n).padStart(2, '0');
}

function monthKey(date, day) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(day)}`;
}

function getNextMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function getPrevMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - 1);
  return d;
}

function getMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function lastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Build a mock getEntries that returns different entries depending on the
 * requested date range. Keyed by "YYYY-MM" of the startDate.
 */
function createEntriesMock(entriesByMonth) {
  return vi.fn().mockImplementation((startDate) => {
    const monthPrefix = startDate.slice(0, 7); // "YYYY-MM"
    const entries = entriesByMonth[monthPrefix] || [];
    return Promise.resolve({ success: true, entries });
  });
}

// ── Tests ───────────────────────────────────────────────────

describe('App integration – user flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.getImages.mockResolvedValue({ success: true, images: [] });
  });

  // ── Flow 1: Complete flow ─────────────────────────────────
  // Load app → shows daily prompt → user clicks "No" → confirmation shown
  // → calendar shows today with 😊 emoji
  // Validates: Requirements 1.2, 2.1

  it('complete flow: load → answer prompt "No" → see confirmation and calendar emoji', async () => {
    const user = userEvent.setup();

    // Initial load returns no entries
    const currentMonthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
    const entriesByMonth = {
      [currentMonthKey]: [],
    };
    apiClient.getEntries = createEntriesMock(entriesByMonth);

    // After answering, updateEntry succeeds
    apiClient.updateEntry.mockResolvedValue({
      success: true,
      entry: { date: todayKey, sugarConsumed: false },
    });

    // After update, refetch returns the new entry
    const refetchEntries = [{ date: todayKey, sugarConsumed: false }];

    render(<App />);

    // 1. App loads and shows loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // 2. Wait for loading to finish – daily prompt is visible
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('daily-prompt')).toBeInTheDocument();
    expect(screen.getByText('Did you eat sugar today?')).toBeInTheDocument();

    // 3. Calendar is rendered with days for the current month
    // Use day 15 which is always unique (no leading/trailing duplicates)
    expect(screen.getByTestId('day-cell-15')).toBeInTheDocument();

    // 4. Update the mock so the refetch after updateEntry returns the new entry
    apiClient.getEntries = vi.fn().mockResolvedValue({
      success: true,
      entries: refetchEntries,
    });

    // 5. User clicks "No"
    await user.click(screen.getByLabelText('No, I did not eat sugar today'));

    // 6. updateEntry was called with today's date and false
    await waitFor(() => {
      expect(apiClient.updateEntry).toHaveBeenCalledWith(todayKey, false);
    });

    // 7. Confirmation message appears
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-message')).toBeInTheDocument();
    });
    expect(screen.getByText(/No sugar today/i)).toBeInTheDocument();

    // 8. Calendar shows 😊 emoji for today
    // Today's date may appear in both current and adjacent month cells,
    // so find the one with role="button" (current month cell).
    await waitFor(() => {
      const allCells = screen.getAllByTestId(`day-cell-${today.getDate()}`);
      const currentMonthCell = allCells.find(
        (cell) => cell.getAttribute('role') === 'button',
      );
      expect(currentMonthCell).toBeDefined();
      expect(currentMonthCell).toHaveTextContent('😊');
    });
  });

  // ── Flow 2: Update flow ───────────────────────────────────
  // Load app with entries → click a day → UpdateDialog opens →
  // user clicks "Yes" → dialog closes → calendar updates to 😔
  // Validates: Requirements 3.1

  it('update flow: click day → update via dialog → calendar reflects change', async () => {
    const user = userEvent.setup();

    // Day 10 of the current month has no sugar initially
    const targetDay = 10;
    const targetDateKey = monthKey(today, targetDay);
    const currentMonthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;

    const initialEntries = [
      { date: targetDateKey, sugarConsumed: false },
    ];

    apiClient.getEntries = createEntriesMock({
      [currentMonthKey]: initialEntries,
    });

    apiClient.updateEntry.mockResolvedValue({
      success: true,
      entry: { date: targetDateKey, sugarConsumed: true },
    });

    render(<App />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // 1. Day 10 initially shows 😊 (no sugar)
    const dayCell = screen.getByTestId(`day-cell-${targetDay}`);
    expect(dayCell).toHaveTextContent('😊');

    // 2. Click day 10 to open UpdateDialog
    await user.click(dayCell);
    await waitFor(() => {
      expect(screen.getByTestId('update-dialog')).toBeInTheDocument();
    });

    // 3. Dialog shows current status
    expect(screen.getByTestId('dialog-current-status')).toHaveTextContent(
      /No sugar/i,
    );

    // 4. Update mock so refetch after update returns the changed entry
    const updatedEntries = [
      { date: targetDateKey, sugarConsumed: true },
    ];
    apiClient.getEntries = vi.fn().mockResolvedValue({
      success: true,
      entries: updatedEntries,
    });

    // 5. Click "Yes" in the dialog
    await user.click(screen.getByLabelText('Yes, sugar was consumed'));

    // 6. updateEntry was called
    await waitFor(() => {
      expect(apiClient.updateEntry).toHaveBeenCalledWith(
        targetDateKey,
        true,
      );
    });

    // 7. Dialog closes
    await waitFor(() => {
      expect(screen.queryByTestId('update-dialog')).not.toBeInTheDocument();
    });

    // 8. Calendar now shows 😔 for day 10
    await waitFor(() => {
      const updatedCell = screen.getByTestId(`day-cell-${targetDay}`);
      expect(updatedCell).toHaveTextContent('😔');
    });
  });

  // ── Flow 3: Navigation flow ───────────────────────────────
  // Load app → click "Next month" → entries for next month displayed →
  // click "Previous month" → returns to original month with original entries
  // Validates: Requirements 3.2

  it('navigation flow: next month → see next month data → prev month → see original data', async () => {
    const user = userEvent.setup();

    const currentMonthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
    const nextMonthDate = getNextMonth(today);
    const nextMonthKey = `${nextMonthDate.getFullYear()}-${pad(nextMonthDate.getMonth() + 1)}`;

    // Current month has an entry on day 5
    const currentMonthEntries = [
      { date: monthKey(today, 5), sugarConsumed: false },
    ];

    // Next month has an entry on day 12
    const nextMonthEntries = [
      { date: monthKey(nextMonthDate, 12), sugarConsumed: true },
    ];

    apiClient.getEntries = createEntriesMock({
      [currentMonthKey]: currentMonthEntries,
      [nextMonthKey]: nextMonthEntries,
    });

    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // 1. Current month label is displayed
    expect(screen.getByText(getMonthLabel(today))).toBeInTheDocument();

    // 2. Day 5 shows 😊 in the current month
    expect(screen.getByTestId('day-cell-5')).toHaveTextContent('😊');

    // 3. Click "Next month"
    await user.click(screen.getByLabelText('Next month'));

    // 4. Wait for next month to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // 5. Next month label is displayed
    await waitFor(() => {
      expect(screen.getByText(getMonthLabel(nextMonthDate))).toBeInTheDocument();
    });

    // 6. Day 12 in next month shows 😔
    await waitFor(() => {
      expect(screen.getByTestId('day-cell-12')).toHaveTextContent('😔');
    });

    // 7. Click "Previous month" to go back
    await user.click(screen.getByLabelText('Previous month'));

    // 8. Wait for original month to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // 9. Original month label is displayed again
    await waitFor(() => {
      expect(screen.getByText(getMonthLabel(today))).toBeInTheDocument();
    });

    // 10. Day 5 shows 😊 again (original data restored)
    await waitFor(() => {
      expect(screen.getByTestId('day-cell-5')).toHaveTextContent('😊');
    });
  });
});
