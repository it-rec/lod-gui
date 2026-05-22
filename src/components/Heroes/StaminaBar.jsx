import Button from '../common/Button/Button';
import { IconPlus, IconMinus, IconRest } from '../common/icons';
import styles from './StaminaBar.module.scss';

// The always-visible vitality tracker on a hero card: a coloured bar plus
// quick lose / gain / rest controls. Max is edited in the card's details.
const StaminaBar = ({ current, max, onChange }) => {
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, current / safeMax));
  const tier = ratio > 0.5 ? 'high' : ratio > 0.25 ? 'mid' : 'low';
  const setCurrent = (next) =>
    onChange({ current: Math.max(0, Math.min(next, safeMax)), max });

  return (
    <div className={styles.stamina}>
      <div className={styles.top}>
        <span className={styles.label}>Vitality</span>
        <span className={styles.readout}>
          <strong>{current}</strong>
          <span className={styles.slash}> / {max}</span>
        </span>
      </div>

      <div
        className={styles.track}
        role="meter"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="Vitality"
      >
        <div
          className={`${styles.fill} ${styles[tier]}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className={styles.controls}>
        <Button
          kind="ghost"
          size="sm"
          iconOnly
          disabled={current <= 0}
          onClick={() => setCurrent(current - 1)}
          aria-label="Lose a point of vitality"
        >
          <IconMinus />
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconOnly
          disabled={current >= max}
          onClick={() => setCurrent(current + 1)}
          aria-label="Restore a point of vitality"
        >
          <IconPlus />
        </Button>
        <Button
          kind="gold"
          size="sm"
          disabled={current >= max}
          onClick={() => setCurrent(max)}
        >
          <IconRest />
          Rest
        </Button>
      </div>
    </div>
  );
};

export default StaminaBar;
