import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import apiClient from './services/apiClient.js';

vi.mock('./services/apiClient.js', () => ({
  default: {
    getEntries: vi.fn(),
    getImages: vi.fn(),
    updateEntry: vi.fn(),
    createEntry: vi.fn(),
  },
}));

const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

function mockSuccessfulLoad(entries = []) {
  apiClient.getEntries.mockResolvedValue({ success: true, entries });
  apiClient.getImages.mockResolvedValue({ success: true, images: [] });
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 12.1: Global state ──────────────────────────────────

  it('renders the app title', async () => {
    mockSuccessfulLoad();
    render(<App />);
    expect(screen.getByText('Sugar Intake Tracker')).toBeInTheDocument();
  });

  it('shows loading indicator while fetching', () => {
    // Never resolve so we stay in loading state
    apiClient.getEntries.mockReturnValue(new Promise(() => {}));
    apiClient.getImages.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('renders main content after loading completes', async () => {
    mockSuccessfulLoad();
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('daily-prompt')).toBeInTheDocument();
  });

  // ── 12.2: Data fetching ─────────────────────────────────

  it('fetches entries for the current month on mount', async () => {
    mockSuccessfulLoad();
    render(<App />);
    await waitFor(() => {
      expect(apiClient.getEntries).toHaveBeenCalledTimes(1);
    });
    const [startDate, endDate] = apiClient.getEntries.mock.calls[0];
    // Start date should be first of current month
    expect(startDate).toMatch(/^\d{4}-\d{2}-01$/);
    // End date should be last day of current month
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('fetches images on mount', async () => {
    mockSuccessfulLoad();
    render(<App />);
    await waitFor(() => {
      expect(apiClient.getImages).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error message when fetching entries fails', async () => {
    apiClient.getEntries.mockRejectedValue(new Error('Network error'));
    apiClient.getImages.mockResolvedValue({ success: true, images: [] });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows retry button on error', async () => {
    apiClient.getEntries.mockRejectedValue(new Error('Server down'));
    apiClient.getImages.mockResolvedValue({ success: true, images: [] });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });
  });

  it('retries fetching when retry button is clicked', async () => {
    const user = userEvent.setup();
    apiClient.getEntries
      .mockRejectedValueOnce(new Error('Server down'))
      .mockResolvedValueOnce({ success: true, entries: [] });
    apiClient.getImages.mockResolvedValue({ success: true, images: [] });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('retry-button'));

    await waitFor(() => {
      expect(apiClient.getEntries).toHaveBeenCalledTimes(2);
    });
  });

  // ── 12.3: Month navigation ──────────────────────────────

  it('navigates to previous month and refetches entries', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Reset call count after initial load
    apiClient.getEntries.mockClear();
    apiClient.getEntries.mockResolvedValue({ success: true, entries: [] });

    await user.click(screen.getByLabelText('Previous month'));

    await waitFor(() => {
      expect(apiClient.getEntries).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to next month and refetches entries', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    apiClient.getEntries.mockClear();
    apiClient.getEntries.mockResolvedValue({ success: true, entries: [] });

    await user.click(screen.getByLabelText('Next month'));

    await waitFor(() => {
      expect(apiClient.getEntries).toHaveBeenCalledTimes(1);
    });
  });

  // ── 12.4: Entry update handlers ─────────────────────────

  it('calls updateEntry when daily prompt Yes is clicked', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();
    apiClient.updateEntry.mockResolvedValue({
      success: true,
      entry: { date: todayKey, sugarConsumed: true },
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Yes, I ate sugar today'));

    await waitFor(() => {
      expect(apiClient.updateEntry).toHaveBeenCalledWith(todayKey, true);
    });
  });

  it('calls updateEntry when daily prompt No is clicked', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();
    apiClient.updateEntry.mockResolvedValue({
      success: true,
      entry: { date: todayKey, sugarConsumed: false },
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('No, I did not eat sugar today'));

    await waitFor(() => {
      expect(apiClient.updateEntry).toHaveBeenCalledWith(todayKey, false);
    });
  });

  it('passes todayEntry to DailyPrompt when entry exists', async () => {
    const entries = [{ date: todayKey, sugarConsumed: true }];
    mockSuccessfulLoad(entries);

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // DailyPrompt shows current status when todayEntry is provided
    expect(screen.getByTestId('current-status')).toBeInTheDocument();
  });

  it('opens UpdateDialog when a day cell is clicked', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Click on day 15 – always unique in the grid (no leading/trailing duplicates)
    const dayCell = screen.getByTestId('day-cell-15');
    await user.click(dayCell);

    await waitFor(() => {
      expect(screen.getByTestId('update-dialog')).toBeInTheDocument();
    });
  });

  it('closes UpdateDialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const dayCell = screen.getByTestId('day-cell-15');
    await user.click(dayCell);

    await waitFor(() => {
      expect(screen.getByTestId('update-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close dialog'));

    await waitFor(() => {
      expect(screen.queryByTestId('update-dialog')).not.toBeInTheDocument();
    });
  });

  it('calls updateEntry from UpdateDialog and closes it', async () => {
    const user = userEvent.setup();
    mockSuccessfulLoad();
    apiClient.updateEntry.mockResolvedValue({
      success: true,
      entry: { date: todayKey, sugarConsumed: true },
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const dayCell = screen.getByTestId('day-cell-15');
    await user.click(dayCell);

    await waitFor(() => {
      expect(screen.getByTestId('update-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Yes, sugar was consumed'));

    await waitFor(() => {
      expect(apiClient.updateEntry).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('update-dialog')).not.toBeInTheDocument();
    });
  });

  it('silently handles image fetch failure', async () => {
    apiClient.getEntries.mockResolvedValue({ success: true, entries: [] });
    apiClient.getImages.mockRejectedValue(new Error('Image fetch failed'));

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // App should still render without error
    expect(screen.getByTestId('daily-prompt')).toBeInTheDocument();
    // No error message for image failure
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
});
