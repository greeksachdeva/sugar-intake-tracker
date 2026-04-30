import { useState, useEffect, useCallback } from 'react';
import apiClient from './services/apiClient.js';
import { formatDateKey } from './utils/calendarUtils.js';
import DailyPrompt from './components/DailyPrompt/DailyPrompt.jsx';
import Calendar from './components/Calendar/Calendar.jsx';
import UpdateDialog from './components/UpdateDialog/UpdateDialog.jsx';
import ImageDisplay from './components/ImageDisplay/ImageDisplay.jsx';
import styles from './styles/App.module.css';

/**
 * App component – root of the Sugar Intake Tracker.
 *
 * Manages global state for the current month, entries, images,
 * loading/error states, and the selected date for the update dialog.
 */
export default function App() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [entries, setEntries] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  /**
   * Fetch entries for a given month from the backend.
   */
  const fetchEntries = useCallback(async (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const startDate = formatDateKey(new Date(year, monthIndex, 1));
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const endDate = formatDateKey(new Date(year, monthIndex, lastDay));

    const data = await apiClient.getEntries(startDate, endDate);
    return data.entries || [];
  }, []);

  /**
   * Fetch images from the backend (called once on mount).
   */
  const fetchImages = useCallback(async () => {
    const data = await apiClient.getImages();
    return data.images || [];
  }, []);

  /**
   * Load entries for the current month. Sets loading/error state.
   */
  const loadEntries = useCallback(
    async (month) => {
      setLoading(true);
      setError(null);
      try {
        const fetchedEntries = await fetchEntries(month);
        setEntries(fetchedEntries);
      } catch (err) {
        setError(err.message || 'Failed to load entries');
      } finally {
        setLoading(false);
      }
    },
    [fetchEntries],
  );

  // Fetch images on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const fetchedImages = await fetchImages();
        if (!cancelled) {
          setImages(fetchedImages);
        }
      } catch {
        // Images are non-critical; silently ignore errors
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchImages]);

  // Fetch entries whenever currentMonth changes
  useEffect(() => {
    loadEntries(currentMonth);
  }, [currentMonth, loadEntries]);

  // ── Month navigation ──────────────────────────────────────

  function handlePrevMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  // ── Entry update handlers ─────────────────────────────────

  /**
   * Handle the daily prompt answer for today's date.
   */
  async function handleDailyAnswer(consumed) {
    const todayKey = formatDateKey(new Date());

    // Optimistic update
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === todayKey);
      if (existing) {
        return prev.map((e) =>
          e.date === todayKey ? { ...e, sugarConsumed: consumed } : e,
        );
      }
      return [...prev, { date: todayKey, sugarConsumed: consumed }];
    });

    try {
      await apiClient.updateEntry(todayKey, consumed);
      // Refetch to get the authoritative server state
      const refreshed = await fetchEntries(currentMonth);
      setEntries(refreshed);
    } catch (err) {
      // Revert optimistic update on failure
      const refreshed = await fetchEntries(currentMonth).catch(() => []);
      setEntries(refreshed);
      setError(err.message || 'Failed to save entry');
    }
  }

  /**
   * Handle the update dialog submission for the selected date.
   */
  async function handleUpdateEntry(consumed) {
    if (!selectedDate) return;
    const dateKey = formatDateKey(selectedDate);

    // Optimistic update
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === dateKey);
      if (existing) {
        return prev.map((e) =>
          e.date === dateKey ? { ...e, sugarConsumed: consumed } : e,
        );
      }
      return [...prev, { date: dateKey, sugarConsumed: consumed }];
    });

    try {
      await apiClient.updateEntry(dateKey, consumed);
      const refreshed = await fetchEntries(currentMonth);
      setEntries(refreshed);
    } catch (err) {
      const refreshed = await fetchEntries(currentMonth).catch(() => []);
      setEntries(refreshed);
      setError(err.message || 'Failed to update entry');
    }

    setSelectedDate(null);
  }

  // ── Day click → open update dialog ────────────────────────

  function handleDayClick(date) {
    setSelectedDate(date);
  }

  function handleCloseDialog() {
    setSelectedDate(null);
  }

  // ── Retry on error ────────────────────────────────────────

  function handleRetry() {
    loadEntries(currentMonth);
  }

  // ── Derived data ──────────────────────────────────────────

  const todayKey = formatDateKey(new Date());
  const todayEntry = entries.find((e) => e.date === todayKey) || null;

  const selectedEntry = selectedDate
    ? entries.find((e) => e.date === formatDateKey(selectedDate)) || null
    : null;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sugar Intake Tracker</h1>
        <p className={styles.subtitle}>Track your daily sugar consumption</p>
      </header>

      {error && (
        <div className={styles.error} data-testid="error-message">
          <p>{error}</p>
          <button
            className={styles.retryButton}
            onClick={handleRetry}
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading…
        </div>
      ) : (
        <main className={styles.main}>
          <DailyPrompt onAnswer={handleDailyAnswer} todayEntry={todayEntry} />

          <Calendar
            month={currentMonth}
            entries={entries}
            onDayClick={handleDayClick}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          <ImageDisplay images={images} />
        </main>
      )}

      {selectedDate && (
        <UpdateDialog
          date={selectedDate}
          currentEntry={selectedEntry}
          onUpdate={handleUpdateEntry}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
