import { useState } from 'react';
import cx from 'classnames';
import TextInput from '../TextInput/TextInput';
import Button from '../Button/Button';
import { IconPlus } from '../icons';
import styles from './ChipEditor.module.scss';

// An editable list of short text chips (used for traits and conditions).
// `tone` switches between the neutral and warning chip styles.
const ChipEditor = ({
  values,
  onChange,
  placeholder,
  list,
  tone = 'neutral',
  ariaLabel = 'New entry',
}) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const entry = draft.trim();
    if (entry && !values.includes(entry)) onChange([...values, entry]);
    setDraft('');
  };

  return (
    <div className={styles.editor}>
      {values.length > 0 && (
        <ul className={styles.chips}>
          {values.map((value) => (
            <li key={value} className={cx(styles.chip, styles[tone])}>
              <span>{value}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(values.filter((entry) => entry !== value))}
                aria-label={`Remove ${value}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.add}>
        <TextInput
          variant="sm"
          value={draft}
          list={list}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button kind="ghost" size="sm" iconOnly onClick={add} aria-label="Add entry">
          <IconPlus />
        </Button>
      </div>
    </div>
  );
};

export default ChipEditor;
