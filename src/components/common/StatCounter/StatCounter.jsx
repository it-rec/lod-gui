import { useEffect, useState } from 'react';
import Button from '../Button/Button';
import { IconPlus, IconMinus } from '../icons';
import styles from './StatCounter.module.scss';

const clamp = (n) => Math.max(0, Math.min(n, 9999999));

// A large, editable integer counter with quick ±1 / ±10 steppers — used for
// the party's Gold and Renown.
const StatCounter = ({ value, onChange, watermark }) => {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = (raw) => {
    const digits = raw.replace(/[^\d]/g, '');
    onChange(digits === '' ? 0 : clamp(parseInt(digits, 10)));
  };

  const step = (delta) => onChange(clamp(value + delta));

  return (
    <div className={styles.counter}>
      {watermark && <div className={styles.watermark}>{watermark}</div>}

      <div className={styles.valueRow}>
        <input
          className={styles.value}
          inputMode="numeric"
          aria-label="Current amount"
          value={editing ? draft : value.toLocaleString('en-US')}
          onFocus={() => {
            setEditing(true);
            setDraft(String(value));
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          onBlur={() => setEditing(false)}
        />
      </div>

      <div className={styles.steppers}>
        <Button kind="ghost" size="sm" onClick={() => step(-10)} aria-label="Subtract ten">
          −10
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconOnly
          onClick={() => step(-1)}
          aria-label="Subtract one"
        >
          <IconMinus />
        </Button>
        <Button
          kind="gold"
          size="sm"
          iconOnly
          onClick={() => step(1)}
          aria-label="Add one"
        >
          <IconPlus />
        </Button>
        <Button kind="ghost" size="sm" onClick={() => step(10)} aria-label="Add ten">
          +10
        </Button>
      </div>
    </div>
  );
};

export default StatCounter;
