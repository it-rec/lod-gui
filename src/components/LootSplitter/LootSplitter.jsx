import { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import { IconCoins, IconCheck } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import { normalizeHeroes } from '../character';
import { toast } from '../common/Toast/toastStore';
import styles from './LootSplitter.module.scss';

const PHASE_IDS = ['morning', 'afternoon', 'evening', 'night'];

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `loot-${Math.random().toString(36).slice(2, 10)}`;

// Pure "how do N coins split N ways" so the maths is testable without a
// React tree. Returns { each, remainder } — the remainder stays in the
// party kitty.
export const splitEvenly = (total, shareCount) => {
  const n = Math.max(0, Math.floor(Number(total) || 0));
  const k = Math.max(0, Math.floor(Number(shareCount) || 0));
  if (k === 0) return { each: 0, remainder: n };
  return { each: Math.floor(n / k), remainder: n % k };
};

const LootSplitter = ({ trigger: TriggerProp }) => {
  const [open, setOpen] = useState(false);
  const [totalDraft, setTotalDraft] = useState('');
  const [excluded, setExcluded] = useState(() => new Set());
  const dialogRef = useRef(null);

  const { value: heroes } = useGameChannel({
    channel: collections.HEROES,
    path: '/api/game/1/heroes/',
    initial: [],
    fromServer: (raw) => normalizeHeroes(raw?.heroes ?? raw),
    toServer: (list) => ({ heroes: list }),
  });

  const { value: gold, save: saveGold } = useGameChannel({
    channel: collections.GOLD,
    path: '/api/game/1/gold/',
    initial: 0,
    fromServer: (raw) => raw?.gold ?? 0,
    toServer: (next) => ({ gold: next }),
  });

  const { value: journal, save: saveJournal } = useGameChannel({
    channel: collections.JOURNAL,
    path: '/api/game/1/journal/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.entries) ? raw.entries : []),
    toServer: (entries) => ({ entries }),
  });

  const { value: calendar } = useGameChannel({
    channel: collections.CALENDAR,
    path: '/api/game/1/calendar/',
    initial: { day: 1, time: 'morning' },
    fromServer: (raw) => ({
      day: Number.isFinite(raw?.day) && raw.day > 0 ? Math.round(raw.day) : 1,
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
    }),
  });

  const namedHeroes = useMemo(
    () => heroes.filter((hero) => hero.name && hero.name.trim()),
    [heroes]
  );

  // Reset selection whenever the dialog opens — using a tiny effect so the
  // checkboxes reflect the current roster, not whoever was in the party last
  // time loot was split.
  useEffect(() => {
    if (!open) return;
    setExcluded(new Set());
    setTotalDraft('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const total = Math.max(0, Math.floor(Number(totalDraft) || 0));
  const included = namedHeroes.filter((hero) => !excluded.has(hero.id));
  const { each, remainder } = splitEvenly(total, included.length);
  const canDistribute = total > 0 && included.length > 0;

  const toggle = (id) => {
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const distribute = () => {
    if (!canDistribute) return;
    const names = included.map((hero) => hero.name.trim());
    const list = names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    const text = remainder > 0
      ? `Split ${total} gold: ${each} each to ${list}; ${remainder} left to the party kitty.`
      : `Split ${total} gold: ${each} each to ${list}.`;

    saveGold(gold + total);
    const entry = {
      id: uid(),
      day: calendar.day,
      time: calendar.time,
      text,
      author: 'Loot splitter',
      createdAt: new Date().toISOString(),
    };
    saveJournal([entry, ...(journal || [])]);
    toast.success('Loot split', text, 'loot-split');
    setOpen(false);
  };

  const Trigger = TriggerProp || DefaultTrigger;

  return (
    <>
      <Trigger onClick={() => setOpen(true)} />
      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-label="Split loot"
            aria-modal="true"
            className={styles.dialog}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.head}>
              <h2 className={styles.title}>Split loot</h2>
              <p className={styles.subtitle}>
                Adds the total to the party&apos;s gold and logs the breakdown
                in the journal.
              </p>
            </header>

            <label className={styles.totalRow}>
              <span className={styles.totalLabel}>Found</span>
              <TextInput
                autoFocus
                variant="sm"
                inputMode="numeric"
                value={totalDraft}
                placeholder="0"
                aria-label="Total gold found"
                onChange={(event) => setTotalDraft(event.target.value.replace(/\D+/g, ''))}
              />
              <span className={styles.totalUnit}>gold</span>
            </label>

            <fieldset className={styles.heroes}>
              <legend className={styles.heroesLegend}>Share with</legend>
              {namedHeroes.length === 0 ? (
                <p className={styles.empty}>
                  Add at least one named hero in the Party panel to split loot.
                </p>
              ) : (
                <ul className={styles.heroList}>
                  {namedHeroes.map((hero) => {
                    const checked = !excluded.has(hero.id);
                    return (
                      <li key={hero.id}>
                        <label className={cx(styles.heroLabel, { [styles.heroExcluded]: !checked })}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(hero.id)}
                          />
                          <span className={styles.heroName}>{hero.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <div className={styles.preview} aria-live="polite">
              <div className={styles.previewLine}>
                <span className={styles.previewLabel}>Each</span>
                <span className={styles.previewValue}>
                  <IconCoins /> {each}
                </span>
              </div>
              <div className={styles.previewLine}>
                <span className={styles.previewLabel}>Left over</span>
                <span className={styles.previewValue}>
                  <IconCoins /> {remainder}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button kind="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                kind="gold"
                size="sm"
                onClick={distribute}
                disabled={!canDistribute}
              >
                <IconCheck />
                Distribute
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DefaultTrigger = ({ onClick }) => (
  <Button kind="ghost" size="sm" onClick={onClick} className={styles.defaultTrigger}>
    Split loot…
  </Button>
);

export default LootSplitter;
