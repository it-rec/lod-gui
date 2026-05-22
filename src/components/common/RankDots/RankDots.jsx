import cx from 'classnames';
import styles from './RankDots.module.scss';

// A pip-based rank control: clicking dot N sets the rank to N. Used for
// Legacy of Dragonholt skill ranks.
const RankDots = ({ value, max = 6, onChange, label = 'rank' }) => (
  <div className={styles.dots} role="group" aria-label={label}>
    {Array.from({ length: max }, (_, index) => index + 1).map((dot) => (
      <button
        key={dot}
        type="button"
        className={cx(styles.dot, { [styles.filled]: dot <= value })}
        onClick={() => onChange(dot)}
        aria-label={`Set ${label} to ${dot}`}
        aria-pressed={dot <= value}
      />
    ))}
  </div>
);

export default RankDots;
