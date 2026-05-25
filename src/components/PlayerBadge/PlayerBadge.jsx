import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import { IconPeople } from '../common/icons';
import { usePlayerName } from '../../hooks/usePlayerName';
import styles from './PlayerBadge.module.scss';

const PlayerBadge = () => {
  const { name, setName } = usePlayerName();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setDraft(name);
  }, [open, name]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
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
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  const commit = () => {
    setName(draft.trim());
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={popoverRef}>
      <Button
        kind="ghost"
        size="sm"
        aria-label={name ? `You are ${name}. Change your player name.` : 'Set your player name'}
        title={name ? `You are ${name}` : 'Set your player name'}
        onClick={() => setOpen((value) => !value)}
        className={styles.trigger}
      >
        <IconPeople />
        <span className={styles.label}>{name || 'Set name'}</span>
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Set your player name"
          className={styles.popover}
        >
          <p className={styles.heading}>Who are you?</p>
          <p className={styles.hint}>
            Your name attributes dice rolls and journal entries.
          </p>
          <TextInput
            ref={inputRef}
            value={draft}
            placeholder="Your hero or player name"
            aria-label="Player name"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
            }}
          />
          <div className={styles.actions}>
            <Button kind="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button kind="gold" size="sm" onClick={commit}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerBadge;
