import { useCallback, useEffect, useState } from 'react';
import Button from '../common/Button/Button';
import { IconHelp } from '../common/icons';
import styles from './KeyboardHelp.module.scss';

const OPEN_EVENT = 'lod:help:open';

const inEditableField = () => {
  const active = document.activeElement;
  if (!active) return false;
  if (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.tagName === 'SELECT' ||
    active.isContentEditable
  ) {
    return true;
  }
  return false;
};

const SECTIONS = [
  {
    title: 'Global',
    rows: [
      { keys: ['Ctrl', 'K'], also: ['⌘', 'K'], description: 'Open the campaign finder' },
      { keys: ['/'], description: 'Open the finder (when not typing)' },
      { keys: ['?'], description: 'Show this shortcut list' },
      { keys: ['Esc'], description: 'Close any open dialog' },
    ],
  },
  {
    title: 'Lists & editors',
    rows: [
      { keys: ['Enter'], description: 'Add a new quest, person, place, or keyword' },
      { keys: ['Ctrl', 'Enter'], also: ['⌘', 'Enter'], description: 'Record a journal entry or commit an inline edit' },
      { keys: ['↑'], description: 'Move the focused item up (drag handle)' },
      { keys: ['↓'], description: 'Move the focused item down (drag handle)' },
      { keys: ['Esc'], description: 'Cancel an in-place edit' },
    ],
  },
  {
    title: 'Finder results',
    rows: [
      { keys: ['↑', '↓'], description: 'Move the highlight between matches' },
      { keys: ['Enter'], description: 'Jump to the highlighted result' },
    ],
  },
];

export const openKeyboardHelp = () => {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
};

export const KeyboardHelpButton = () => (
  <Button
    kind="ghost"
    size="sm"
    iconOnly
    aria-label="Keyboard shortcuts (?)"
    title="Keyboard shortcuts (?)"
    onClick={openKeyboardHelp}
  >
    <IconHelp />
  </Button>
);

const Combo = ({ keys }) => (
  <span className={styles.combo}>
    {keys.map((key, index) => (
      <kbd key={index} className={styles.key}>
        {key}
      </kbd>
    ))}
  </span>
);

const KeyboardHelp = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !inEditableField()) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard shortcuts</h2>
          <kbd className={styles.key}>Esc</kbd>
        </div>
        <div className={styles.body}>
          {SECTIONS.map((section) => (
            <section key={section.title} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <dl className={styles.list}>
                {section.rows.map((row, index) => (
                  <div key={index} className={styles.row}>
                    <dt className={styles.combos}>
                      <Combo keys={row.keys} />
                      {row.also && (
                        <>
                          <span className={styles.or}>or</span>
                          <Combo keys={row.also} />
                        </>
                      )}
                    </dt>
                    <dd className={styles.description}>{row.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardHelp;
