import styles from './DayCell.module.css';

/**
 * DayCell component – renders an individual calendar day with visual feedback.
 *
 * Props:
 *  - date {Date}           Date object for this cell
 *  - entry {Object|null}   Entry object ({ date, sugarConsumed, … }) or null
 *  - onClick {Function}    Callback invoked with the date when clicked
 *  - isToday {boolean}     Whether this date is today
 *  - isCurrentMonth {boolean} Whether this date belongs to the displayed month
 */
export default function DayCell({
  date,
  entry = null,
  onClick,
  isToday = false,
  isCurrentMonth = true,
}) {
  /**
   * Determine the CSS class based on entry status.
   */
  function getStatusClass() {
    if (!entry) return styles.noEntry;
    return entry.sugarConsumed ? styles.sugarConsumed : styles.noSugar;
  }

  /**
   * Return the appropriate emoji based on entry status.
   */
  function getEmoji() {
    if (!entry) return null;
    return entry.sugarConsumed ? '😔' : '😊';
  }

  function handleClick() {
    if (isCurrentMonth && onClick) {
      onClick(date);
    }
  }

  function handleKeyDown(e) {
    if (isCurrentMonth && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (onClick) {
        onClick(date);
      }
    }
  }

  const emoji = getEmoji();

  const classNames = [
    styles.dayCell,
    getStatusClass(),
    isToday ? styles.today : '',
    !isCurrentMonth ? styles.otherMonth : '',
  ]
    .filter(Boolean)
    .join(' ');

  const monthLabel = date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const ariaLabel = isCurrentMonth
    ? `${date.getDate()} ${monthLabel}${isToday ? ' (today)' : ''}${
        entry
          ? entry.sugarConsumed
            ? ' - sugar consumed'
            : ' - no sugar'
          : ''
      }`
    : undefined;

  return (
    <div
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isCurrentMonth ? 'button' : undefined}
      tabIndex={isCurrentMonth ? 0 : undefined}
      aria-label={ariaLabel}
      data-testid={`day-cell-${date.getDate()}`}
    >
      <span className={styles.dayNumber}>{date.getDate()}</span>
      {emoji && <span className={styles.emoji}>{emoji}</span>}
    </div>
  );
}
