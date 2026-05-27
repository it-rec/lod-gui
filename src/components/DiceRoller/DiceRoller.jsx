import { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import { IconDice, IconTrash, IconPlus } from '../common/icons';
import { useDiceLog } from '../../hooks/useDiceLog';
import { useDiceMacros } from '../../hooks/useDiceMacros';
import { toast } from '../common/Toast/toastStore';
import styles from './DiceRoller.module.scss';

const QUICK_DICE = [
  { label: 'd4', expression: '1d4' },
  { label: 'd6', expression: '1d6' },
  { label: 'd8', expression: '1d8' },
  { label: 'd10', expression: '1d10' },
  { label: 'd12', expression: '1d12' },
  { label: 'd20', expression: '1d20' },
  { label: '2d6', expression: '2d6' },
  { label: 'd100', expression: '1d100' },
];

const formatTimeAgo = (iso, now) => {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

// Highlight a 1 (botch) or a max-face (crit) on a single-die d20-style roll
// so the table can spot them at a glance.
const diceClass = (sides, value) => {
  if (sides !== 20) return styles.die;
  if (value === 1) return cx(styles.die, styles.dieBotch);
  if (value === 20) return cx(styles.die, styles.dieCrit);
  return styles.die;
};

const RollEntry = ({ entry, now, onReroll }) => {
  const ago = formatTimeAgo(entry.rolledAt, now);
  return (
    <li
      className={cx(styles.entry, { [styles.entryOwn]: entry.own })}
      aria-live="polite"
    >
      <div className={styles.entryHead}>
        <span className={styles.entryWho}>
          {entry.by ? entry.by : entry.own ? 'You' : 'Stranger'}
        </span>
        <span className={styles.entryExpr}>{entry.expression}</span>
        <span className={styles.entryAgo}>{ago}</span>
      </div>
      <div className={styles.entryBody}>
        <div className={styles.diceRow}>
          {entry.groups.map((group, idx) => (
            <span key={idx} className={styles.diceGroup}>
              {group.sign < 0 && <span className={styles.minus}>−</span>}
              {group.rolls.map((value, i) => (
                <span
                  key={i}
                  className={diceClass(group.sides, value)}
                  title={`d${group.sides}`}
                >
                  {value}
                </span>
              ))}
            </span>
          ))}
          {entry.modifier !== 0 && (
            <span className={styles.modifier}>
              {entry.modifier > 0 ? `+${entry.modifier}` : entry.modifier}
            </span>
          )}
        </div>
        <span className={styles.total} aria-label={`Total ${entry.total}`}>
          = {entry.total}
        </span>
      </div>
      {onReroll && (
        <button
          type="button"
          className={styles.reroll}
          onClick={() => onReroll(entry.expression)}
          aria-label={`Roll ${entry.expression} again`}
        >
          Re-roll
        </button>
      )}
    </li>
  );
};

const DiceRoller = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [macroName, setMacroName] = useState('');
  const [flash, setFlash] = useState(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const { entries, roll, clear, rollerName, setRollerName } = useDiceLog();
  const { macros, add: addMacro, remove: removeMacro } = useDiceMacros();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  // Close on outside click / Escape — same pattern as CampaignMenu.
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

  // When the popover opens, drop focus into the expression input so the GM
  // can type a custom roll without reaching for the mouse.
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Briefly flash the button when a roll arrives from a peer so a watching
  // player notices that someone else rolled.
  const lastOtherIdRef = useRef(null);
  useEffect(() => {
    const latestOther = entries.find((entry) => !entry.own);
    if (!latestOther) return undefined;
    if (lastOtherIdRef.current === latestOther.id) return undefined;
    const isFirstObservation = lastOtherIdRef.current === null;
    lastOtherIdRef.current = latestOther.id;
    if (isFirstObservation) return undefined;
    setFlash(latestOther.id);
    if (!open) {
      const who = latestOther.by || 'A fellow player';
      toast.info(
        `${who} rolled ${latestOther.expression}`,
        `Total: ${latestOther.total}`,
        'dice-peer'
      );
    }
    const id = window.setTimeout(() => setFlash(null), 1200);
    return () => window.clearTimeout(id);
  }, [entries, open]);

  const handleRoll = (expression) => {
    const result = roll(expression);
    if (result.error) {
      toast.error('Bad roll', result.error, 'dice-error');
      return;
    }
    setDraft('');
  };

  const handleCustom = (event) => {
    event.preventDefault();
    const expression = draft.trim();
    if (!expression) return;
    handleRoll(expression);
  };

  const handleSaveMacro = () => {
    const name = macroName.trim();
    const expression = draft.trim();
    if (!name || !expression) return;
    const entry = addMacro(name, expression);
    if (!entry) {
      toast.error('Macro not saved', 'Name and expression are required.', 'macro-save');
      return;
    }
    setMacroName('');
    setDraft('');
  };

  const latestOwnTotal = useMemo(() => {
    const latest = entries.find((entry) => entry.own);
    return latest?.total ?? null;
  }, [entries]);

  return (
    <div className={styles.wrapper}>
      <Button
        ref={triggerRef}
        kind="ghost"
        size="sm"
        iconOnly
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open dice roller"
        onClick={() => setOpen((value) => !value)}
        className={cx(styles.trigger, { [styles.triggerFlash]: flash })}
      >
        <IconDice />
        {latestOwnTotal != null && !open && (
          <span className={styles.triggerBadge} aria-hidden="true">
            {latestOwnTotal}
          </span>
        )}
      </Button>
      {open && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="dialog"
          aria-label="Dice roller"
        >
          <div className={styles.head}>
            <span className={styles.title}>Roll the bones</span>
            <span className={styles.subtitle}>
              Live — everyone at the table sees the result.
            </span>
          </div>

          <div className={styles.nameRow}>
            <label className={styles.nameLabel}>
              <span className={styles.nameLabelText}>Rolled by</span>
              <TextInput
                variant="sm"
                value={rollerName}
                placeholder="Your hero's name"
                aria-label="Roller name"
                onChange={(event) => setRollerName(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.quickGrid} role="group" aria-label="Quick rolls">
            {QUICK_DICE.map((die) => (
              <button
                key={die.label}
                type="button"
                className={styles.quick}
                onClick={() => handleRoll(die.expression)}
              >
                {die.label}
              </button>
            ))}
          </div>

          <form className={styles.custom} onSubmit={handleCustom}>
            <TextInput
              ref={inputRef}
              variant="sm"
              value={draft}
              placeholder="e.g. 2d6+3"
              aria-label="Custom roll expression"
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button kind="gold" size="sm" type="submit" disabled={!draft.trim()}>
              Roll
            </Button>
          </form>

          <div className={styles.macroSection}>
            <div className={styles.macroHead}>
              <span className={styles.macroTitle}>Macros</span>
              <span className={styles.macroHint}>Saved on this device only</span>
            </div>
            {macros.length === 0 ? (
              <p className={styles.macroEmpty}>
                Name your custom roll above to save it as a one-tap macro.
              </p>
            ) : (
              <ul className={styles.macroList} aria-label="Saved dice macros">
                {macros.map((macro) => (
                  <li key={macro.id} className={styles.macroItem}>
                    <button
                      type="button"
                      className={styles.macroPill}
                      onClick={() => handleRoll(macro.expression)}
                      title={`Roll ${macro.expression}`}
                    >
                      <span className={styles.macroName}>{macro.name}</span>
                      <span className={styles.macroExpr}>{macro.expression}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.macroDelete}
                      onClick={() => removeMacro(macro.id)}
                      aria-label={`Delete macro ${macro.name}`}
                    >
                      <IconTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.macroForm}>
              <TextInput
                variant="sm"
                value={macroName}
                placeholder="Name (e.g. Longsword attack)"
                aria-label="New macro name"
                onChange={(event) => setMacroName(event.target.value)}
              />
              <Button
                kind="ghost"
                size="sm"
                onClick={handleSaveMacro}
                disabled={!macroName.trim() || !draft.trim()}
                title={
                  !draft.trim()
                    ? 'Type an expression above first'
                    : !macroName.trim()
                      ? 'Give it a name first'
                      : 'Save macro'
                }
              >
                <IconPlus />
                Save
              </Button>
            </div>
          </div>

          <div className={styles.logHead}>
            <span className={styles.logTitle}>Recent rolls</span>
            {entries.length > 0 && (
              <button
                type="button"
                className={styles.clear}
                onClick={clear}
                aria-label="Clear roll history"
              >
                <IconTrash />
                Clear
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <p className={styles.empty}>
              No rolls yet. Tap a die above or type your own.
            </p>
          ) : (
            <ul className={styles.log}>
              {entries.map((entry) => (
                <RollEntry
                  key={entry.id}
                  entry={entry}
                  now={now}
                  onReroll={handleRoll}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
