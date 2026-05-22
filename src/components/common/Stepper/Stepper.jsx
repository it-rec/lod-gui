import Button from '../Button/Button';
import { IconPlus, IconMinus } from '../icons';
import styles from './Stepper.module.scss';

// A compact − value + control for small bounded numbers (level, item count,
// max vitality). Stays within [min, max].
const Stepper = ({ value, onChange, min = 0, max = Infinity, label = 'value' }) => (
  <div className={styles.stepper}>
    <Button
      kind="ghost"
      size="sm"
      iconOnly
      disabled={value <= min}
      onClick={() => onChange(Math.max(min, value - 1))}
      aria-label={`Decrease ${label}`}
    >
      <IconMinus />
    </Button>
    <span className={styles.value}>{value}</span>
    <Button
      kind="ghost"
      size="sm"
      iconOnly
      disabled={value >= max}
      onClick={() => onChange(Math.min(max, value + 1))}
      aria-label={`Increase ${label}`}
    >
      <IconPlus />
    </Button>
  </div>
);

export default Stepper;
