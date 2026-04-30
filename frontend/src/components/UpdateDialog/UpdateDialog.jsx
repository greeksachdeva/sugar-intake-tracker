import { useState } from 'react';
import styles from './UpdateDialog.module.css';

/**
 * UpdateDialog component – modal dialog for updating sugar status on a
 * specific date.
 *
 * Props:
 *  - date {Date}              The date to update
 *  - currentEntry {Object|null} Existing entry for the date, if any
 *  - onUpdate {Function}      Callback invoked with (consumed: boolean)
 *  - onClose {Function}       Callback to close the dialog
 */
export default function UpdateDialog({
  date,
  currentEntry = null,
  onUpdate,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleUpdate(consumed) {
    setSubmitting(true);
    try {
      await onUpdate(consumed);
    } finally {
      setSubmitting(false);
    }
  }

  function handleYes() {
    handleUpdate(true);
  }

  function handleNo() {
    handleUpdate(false);
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  const hasExistingEntry = currentEntry !== null && currentEntry !== undefined;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      data-testid="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Update sugar status for ${formattedDate}`}
    >
      <div className={styles.dialog} data-testid="update-dialog">
        <h2 className={styles.title}>Update Sugar Status</h2>
        <p className={styles.date} data-testid="dialog-date">
          {formattedDate}
        </p>

        {hasExistingEntry && (
          <p className={styles.status} data-testid="dialog-current-status">
            Current status:{' '}
            {currentEntry.sugarConsumed
              ? 'Sugar consumed 😔'
              : 'No sugar 😊'}
          </p>
        )}

        <p className={styles.status}>Did you eat sugar on this day?</p>

        <div className={styles.buttons}>
          <button
            className={styles.yesButton}
            onClick={handleYes}
            disabled={submitting}
            aria-label="Yes, sugar was consumed"
          >
            {submitting ? 'Saving…' : 'Yes 😔'}
          </button>
          <button
            className={styles.noButton}
            onClick={handleNo}
            disabled={submitting}
            aria-label="No, no sugar consumed"
          >
            {submitting ? 'Saving…' : 'No 😊'}
          </button>
        </div>

        <button
          className={styles.closeButton}
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
