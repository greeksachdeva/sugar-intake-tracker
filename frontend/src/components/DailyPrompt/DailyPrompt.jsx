import { useState } from 'react';
import styles from './DailyPrompt.module.css';

/**
 * DailyPrompt component – displays the daily sugar intake question
 * and handles user responses.
 *
 * Props:
 *  - onAnswer {Function}    Callback invoked with (consumed: boolean)
 *  - todayEntry {Object|null} Existing entry for today, if any
 */
export default function DailyPrompt({ onAnswer, todayEntry = null }) {
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);

  async function handleAnswer(consumed) {
    setSubmitting(true);
    try {
      await onAnswer(consumed);
      setAnswered(true);
      setLastAnswer(consumed);
    } finally {
      setSubmitting(false);
    }
  }

  function handleYes() {
    handleAnswer(true);
  }

  function handleNo() {
    handleAnswer(false);
  }

  const hasExistingEntry = todayEntry !== null && todayEntry !== undefined;

  return (
    <div className={styles.prompt} data-testid="daily-prompt">
      <p className={styles.question}>Did you eat sugar today?</p>

      {hasExistingEntry && !answered && (
        <p className={styles.confirmation} data-testid="current-status">
          Current status:{' '}
          {todayEntry.sugarConsumed ? 'Yes 😔' : 'No 😊'}. You can update
          your answer below.
        </p>
      )}

      <div className={styles.buttons}>
        <button
          className={styles.yesButton}
          onClick={handleYes}
          disabled={submitting}
          aria-label="Yes, I ate sugar today"
        >
          Yes
        </button>
        <button
          className={styles.noButton}
          onClick={handleNo}
          disabled={submitting}
          aria-label="No, I did not eat sugar today"
        >
          No
        </button>
      </div>

      {answered && (
        <p className={styles.confirmation} data-testid="confirmation-message">
          {lastAnswer
            ? 'Recorded: You consumed sugar today. 😔'
            : 'Recorded: No sugar today! 😊'}
        </p>
      )}
    </div>
  );
}
