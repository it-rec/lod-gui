import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import { IconScroll, IconCheck } from '../common/icons';
import { GENERATORS } from '../../utils/loreGenerator';
import { toast } from '../common/Toast/toastStore';
import styles from './LoreGenerator.module.scss';

const ORDER = ['tavern', 'npc', 'weather'];

const initialResults = () =>
  ORDER.reduce((acc, id) => {
    acc[id] = GENERATORS[id].generate();
    return acc;
  }, {});

// A small idea-machine for the GM: tavern names, NPCs, weather. Rolls
// fresh entries on demand and exposes a copy-to-clipboard so the result
// can be pasted into whichever panel needs it.
const LoreGenerator = () => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(initialResults);
  const [copiedId, setCopiedId] = useState(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click / Escape — same pattern as DiceRoller.
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

  const reroll = useCallback((id) => {
    setResults((current) => ({ ...current, [id]: GENERATORS[id].generate() }));
    setCopiedId(null);
  }, []);

  const rerollAll = useCallback(() => {
    setResults(initialResults());
    setCopiedId(null);
  }, []);

  const copy = useCallback(async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1400);
    } catch {
      toast.error(
        'Copy failed',
        'Your browser blocked clipboard access.',
        'lore-clipboard'
      );
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <Button
        ref={triggerRef}
        kind="ghost"
        size="sm"
        iconOnly
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Lore generator"
        title="Lore generator"
        onClick={() => setOpen((v) => !v)}
        className={styles.trigger}
      >
        <IconScroll />
      </Button>
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Lore generator"
          className={styles.popover}
        >
          <header className={styles.head}>
            <h2 className={styles.title}>Lore generator</h2>
            <Button kind="ghost" size="sm" onClick={rerollAll}>
              Roll all
            </Button>
          </header>
          <ul className={styles.list}>
            {ORDER.map((id) => {
              const { label } = GENERATORS[id];
              const text = results[id];
              const justCopied = copiedId === id;
              return (
                <li key={id} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.rowLabel}>{label}</span>
                    <div className={styles.rowActions}>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => reroll(id)}
                      >
                        Reroll
                      </Button>
                      <Button
                        kind={justCopied ? 'gold' : 'ghost'}
                        size="sm"
                        onClick={() => copy(id, text)}
                        aria-label={`Copy ${label.toLowerCase()}`}
                      >
                        {justCopied ? <IconCheck /> : null}
                        {justCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <p className={styles.result} data-testid={`lore-result-${id}`}>
                    {text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoreGenerator;
