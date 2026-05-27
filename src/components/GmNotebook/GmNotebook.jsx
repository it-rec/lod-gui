import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import { IconLock } from '../common/icons';
import { prefGet, prefSet } from '../../utils/localStorageUtil';
import styles from './GmNotebook.module.scss';

const PREF_KEY = 'gm-notebook';
const SAVE_DEBOUNCE_MS = 400;

const loadNotes = () => {
  const stored = prefGet(PREF_KEY);
  return typeof stored === 'string' ? stored : '';
};

const countWords = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

// A private scratchpad that lives only on the storyteller's device. Stored
// under the per-device "preference" namespace in localStorage so it
// survives reloads but is never written to the backend or broadcast over
// Socket.IO. Distinct from the Journal (which is the shared session log).
const GmNotebook = () => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(loadNotes);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Keep the latest notes in a ref so the unmount-flush can read them
  // without re-creating the effect on every keystroke (which would
  // otherwise persist stale values from earlier renders).
  const notesRef = useRef(notes);
  notesRef.current = notes;

  // Persist on a short debounce so a long typing burst writes once at the end.
  const onChange = useCallback((event) => {
    const next = event.target.value;
    setNotes(next);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      prefSet(PREF_KEY, next);
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Make sure a pending save survives unmount.
  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        prefSet(PREF_KEY, notesRef.current);
      }
    },
    []
  );

  const wordCount = countWords(notes);
  const hasNotes = wordCount > 0;

  return (
    <div className={styles.wrapper}>
      <Button
        ref={triggerRef}
        kind="ghost"
        size="sm"
        iconOnly
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="GM notebook (private)"
        title="GM notebook"
        onClick={() => setOpen((value) => !value)}
        className={styles.trigger}
      >
        <span className={styles.icon} aria-hidden="true">
          <IconLock />
        </span>
        {hasNotes && (
          <span className={styles.badge} aria-hidden="true">
            {wordCount}
          </span>
        )}
      </Button>
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="GM notebook"
          className={styles.popover}
        >
          <header className={styles.head}>
            <div>
              <h2 className={styles.title}>GM notebook</h2>
              <p className={styles.subtitle}>
                <IconLock className={styles.subtitleIcon} />
                Private to this device — never broadcast.
              </p>
            </div>
            <span className={styles.counter} aria-live="polite">
              {wordCount} word{wordCount === 1 ? '' : 's'}
            </span>
          </header>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={notes}
            onChange={onChange}
            placeholder="Hidden NPCs, secret rolls, plot threads, anything the table shouldn't see…"
            aria-label="GM notes"
            spellCheck
          />
        </div>
      )}
    </div>
  );
};

export default GmNotebook;
