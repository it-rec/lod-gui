import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import {
  IconSword,
  IconPlus,
  IconTrash,
  IconRest,
  IconChevron,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections, gamePath } from '../../shared';
import styles from './Initiative.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cmb-${Math.random().toString(36).slice(2, 10)}`;

const SIDES = [
  { id: 'ally', label: 'Ally' },
  { id: 'foe', label: 'Foe' },
  { id: 'neutral', label: 'Neutral' },
];
const SIDE_IDS = SIDES.map((side) => side.id);

const clampInt = (raw, min, max) => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const normalizeInitiative = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { combatants: [], round: 1, currentId: null };
  }
  const combatants = Array.isArray(raw.combatants)
    ? raw.combatants
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const name = typeof entry.name === 'string' ? entry.name.trim() : '';
        if (!name) return null;
        const maxHp = clampInt(entry.maxHp ?? 0, 0, 9999);
        return {
          id: entry.id || uid(),
          name,
          initiative: clampInt(entry.initiative ?? 0, -99, 99),
          hp: clampInt(entry.hp ?? maxHp, 0, 9999),
          maxHp,
          side: SIDE_IDS.includes(entry.side) ? entry.side : 'foe',
          conditions: Array.isArray(entry.conditions)
            ? entry.conditions.filter((c) => typeof c === 'string' && c.trim())
            : [],
        };
      })
      .filter(Boolean)
    : [];
  const ids = new Set(combatants.map((c) => c.id));
  return {
    combatants,
    round: clampInt(raw.round ?? 1, 1, 999),
    currentId: ids.has(raw.currentId) ? raw.currentId : null,
  };
};

// Sort by initiative descending; stable tie-break by id so the order doesn't
// flicker on a re-render when two combatants have the same roll.
const orderCombatants = (combatants) =>
  combatants
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      if (b.c.initiative !== a.c.initiative) return b.c.initiative - a.c.initiative;
      return a.i - b.i;
    })
    .map(({ c }) => c);

const SIDE_LABELS = { ally: 'Ally', foe: 'Foe', neutral: 'Neutral' };

const Initiative = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.INITIATIVE,
    path: gamePath('initiative'),
    initial: { combatants: [], round: 1, currentId: null },
    fromServer: normalizeInitiative,
    toServer: (state) => state,
  });

  const [draftName, setDraftName] = useState('');
  const [draftInit, setDraftInit] = useState('');
  const [draftSide, setDraftSide] = useState('foe');
  const [draftHp, setDraftHp] = useState('');
  const [conditionDrafts, setConditionDrafts] = useState({});

  const ordered = useMemo(() => orderCombatants(value.combatants), [value.combatants]);

  // Quick d20 roll, no modifier — players can also type a number directly.
  const rollFor = () => Math.floor(Math.random() * 20) + 1;

  const add = () => {
    const name = draftName.trim();
    if (!name) return;
    const init = draftInit.trim() ? clampInt(draftInit, -99, 99) : rollFor();
    const hp = draftHp.trim() ? clampInt(draftHp, 0, 9999) : 0;
    const newCombatant = {
      id: uid(),
      name,
      initiative: init,
      hp,
      maxHp: hp,
      side: draftSide,
      conditions: [],
    };
    save({
      ...value,
      combatants: [...value.combatants, newCombatant],
    });
    setDraftName('');
    setDraftInit('');
    setDraftHp('');
  };

  const remove = (id) => {
    const remaining = value.combatants.filter((c) => c.id !== id);
    const nextCurrentId =
      value.currentId === id
        ? remaining.length > 0
          ? orderCombatants(remaining)[0].id
          : null
        : value.currentId;
    save({ ...value, combatants: remaining, currentId: nextCurrentId });
  };

  const setHp = (id, delta) => {
    save({
      ...value,
      combatants: value.combatants.map((c) =>
        c.id === id ? { ...c, hp: clampInt(c.hp + delta, 0, 9999) } : c
      ),
    });
  };

  const addCondition = (id, text) => {
    const condition = text.trim();
    if (!condition) return;
    save({
      ...value,
      combatants: value.combatants.map((c) =>
        c.id === id && !c.conditions.includes(condition)
          ? { ...c, conditions: [...c.conditions, condition] }
          : c
      ),
    });
  };

  const removeCondition = (id, condition) => {
    save({
      ...value,
      combatants: value.combatants.map((c) =>
        c.id === id
          ? { ...c, conditions: c.conditions.filter((x) => x !== condition) }
          : c
      ),
    });
  };

  const startOrAdvance = () => {
    if (ordered.length === 0) return;
    if (!value.currentId) {
      save({ ...value, currentId: ordered[0].id, round: 1 });
      return;
    }
    const idx = ordered.findIndex((c) => c.id === value.currentId);
    if (idx === -1 || idx === ordered.length - 1) {
      save({ ...value, currentId: ordered[0].id, round: value.round + 1 });
    } else {
      save({ ...value, currentId: ordered[idx + 1].id });
    }
  };

  const endEncounter = () => {
    save({ combatants: [], round: 1, currentId: null });
    setConditionDrafts({});
  };

  const subtitle = loading
    ? 'Drawing steel…'
    : ordered.length === 0
      ? 'No combatants in the ring'
      : `Round ${value.round} · ${ordered.length} ${ordered.length === 1 ? 'combatant' : 'combatants'}`;

  const headerActions = ordered.length > 0 ? (
    <>
      <Button kind="ghost" size="sm" onClick={endEncounter}>
        <IconRest />
        End encounter
      </Button>
      <Button kind="crimson" size="sm" onClick={startOrAdvance}>
        {value.currentId ? 'Next turn' : 'Begin!'}
        <IconChevron style={{ transform: 'rotate(-90deg)' }} />
      </Button>
    </>
  ) : null;

  return (
    <Panel
      icon={<IconSword />}
      title="Initiative"
      subtitle={subtitle}
      actions={headerActions}
      error={error}
      onRetry={reload}
      collapsibleKey="initiative"
      defaultCollapsed
    >
      {loading ? (
        <Skeleton height="8rem" />
      ) : (
        <div className={styles.initiative}>
          <div className={styles.add}>
            <TextInput
              value={draftName}
              placeholder="Combatant name"
              aria-label="New combatant name"
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <TextInput
              value={draftInit}
              placeholder="Init"
              aria-label="Initiative roll"
              type="number"
              className={styles.initInput}
              onChange={(event) => setDraftInit(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <TextInput
              value={draftHp}
              placeholder="HP"
              aria-label="Hit points"
              type="number"
              className={styles.hpInput}
              onChange={(event) => setDraftHp(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <div className={styles.sideSelect} role="group" aria-label="Side">
              {SIDES.map((side) => (
                <button
                  key={side.id}
                  type="button"
                  className={cx(styles.sideOption, styles[`side-${side.id}`], {
                    [styles.sideOptionActive]: draftSide === side.id,
                  })}
                  onClick={() => setDraftSide(side.id)}
                  aria-pressed={draftSide === side.id}
                >
                  {side.label}
                </button>
              ))}
            </div>
            <Button kind="gold" onClick={add} disabled={!draftName.trim()}>
              <IconPlus />
              Add
            </Button>
          </div>

          {ordered.length === 0 ? (
            <p className={styles.empty}>
              Roll for initiative! Add the heroes and their foes. If you leave
              the init field empty it rolls a 1d20.
            </p>
          ) : (
            <ol className={styles.list}>
              {ordered.map((combatant) => {
                const isCurrent = combatant.id === value.currentId;
                const isDown = combatant.maxHp > 0 && combatant.hp === 0;
                const draftCond = conditionDrafts[combatant.id] || '';
                return (
                  <li
                    key={combatant.id}
                    className={cx(
                      styles.entry,
                      styles[`entry-${combatant.side}`],
                      {
                        [styles.entryCurrent]: isCurrent,
                        [styles.entryDown]: isDown,
                      }
                    )}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <div className={styles.initBadge} aria-label={`Initiative ${combatant.initiative}`}>
                      {combatant.initiative}
                    </div>
                    <div className={styles.body}>
                      <p className={styles.name}>
                        <span className={cx(styles.sideTag, styles[`side-${combatant.side}`])}>
                          {SIDE_LABELS[combatant.side]}
                        </span>
                        {combatant.name}
                      </p>
                      <div className={styles.hpRow}>
                        <Button
                          kind="ghost"
                          size="sm"
                          iconOnly
                          aria-label={`Take 1 damage from ${combatant.name}`}
                          onClick={() => setHp(combatant.id, -1)}
                          disabled={combatant.hp === 0}
                        >
                          −
                        </Button>
                        <span className={styles.hp}>
                          <span className={styles.hpNow}>{combatant.hp}</span>
                          {combatant.maxHp > 0 && (
                            <span className={styles.hpMax}>
                              / {combatant.maxHp}
                            </span>
                          )}
                        </span>
                        <Button
                          kind="ghost"
                          size="sm"
                          iconOnly
                          aria-label={`Heal 1 for ${combatant.name}`}
                          onClick={() => setHp(combatant.id, +1)}
                          disabled={
                            combatant.maxHp > 0 && combatant.hp >= combatant.maxHp
                          }
                        >
                          +
                        </Button>
                        {combatant.conditions.length > 0 && (
                          <ul className={styles.conditions}>
                            {combatant.conditions.map((condition) => (
                              <li key={condition}>
                                <button
                                  type="button"
                                  className={styles.condition}
                                  onClick={() => removeCondition(combatant.id, condition)}
                                  aria-label={`Remove condition ${condition} from ${combatant.name}`}
                                >
                                  {condition}
                                  <span aria-hidden="true">×</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <TextInput
                        value={draftCond}
                        placeholder="+ condition (poisoned, prone, …)"
                        aria-label={`Add condition to ${combatant.name}`}
                        className={styles.conditionInput}
                        onChange={(event) =>
                          setConditionDrafts((current) => ({
                            ...current,
                            [combatant.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addCondition(combatant.id, draftCond);
                            setConditionDrafts((current) => ({
                              ...current,
                              [combatant.id]: '',
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className={styles.entryActions}>
                      <Button
                        kind="danger"
                        size="sm"
                        iconOnly
                        aria-label={`Remove ${combatant.name} from the encounter`}
                        onClick={() => remove(combatant.id)}
                      >
                        <IconTrash />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </Panel>
  );
};

export default Initiative;
