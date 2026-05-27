import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import { useSortable } from '../../hooks/useSortable';
import {
  IconQuest,
  IconPlus,
  IconTrash,
  IconCheck,
  IconPencil,
  IconGrip,
  IconLock,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import { prefGet, prefSet } from '../../utils/localStorageUtil';
import QuestGraph from './QuestGraph';

const VIEW_PREF_KEY = 'quests-view';
const VALID_VIEWS = new Set(['list', 'graph']);

const loadViewPref = () => {
  const stored = prefGet(VIEW_PREF_KEY);
  return VALID_VIEWS.has(stored) ? stored : 'list';
};
import styles from './Quests.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `quest-${Math.random().toString(36).slice(2, 10)}`;

// Tolerates legacy strings, missing ids, and unexpected shapes — any saved
// quest record is upgraded into the current { id, title, notes, isDone,
// dependsOn } form. `dependsOn` is the set of parent quest ids that must be
// completed before this one can be ticked off.
const normalizeQuests = (raw) => {
  const list = Array.isArray(raw?.quests)
    ? raw.quests
    : Array.isArray(raw)
      ? raw
      : [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') {
        const title = entry.trim();
        return title ? { id: uid(), title, notes: '', isDone: false, dependsOn: [] } : null;
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.title === 'string' &&
        entry.title.trim()
      ) {
        const dependsOn = Array.isArray(entry.dependsOn)
          ? entry.dependsOn.filter((id) => typeof id === 'string' && id)
          : [];
        return {
          id: entry.id || uid(),
          title: entry.title,
          notes: typeof entry.notes === 'string' ? entry.notes : '',
          isDone: Boolean(entry.isDone),
          dependsOn,
        };
      }
      return null;
    })
    .filter(Boolean);
};

// Returns true if every parent quest in `dependsOn` is completed.
export const questIsUnlocked = (quest, allQuests) => {
  const deps = quest.dependsOn || [];
  if (deps.length === 0) return true;
  const byId = new Map(allQuests.map((q) => [q.id, q]));
  return deps.every((id) => {
    const parent = byId.get(id);
    if (!parent) return true; // dangling reference is treated as satisfied
    return parent.isDone;
  });
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Active' },
  { id: 'done', label: 'Completed' },
];

const Quests = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.QUESTS,
    path: '/api/game/1/quests/',
    initial: [],
    fromServer: normalizeQuests,
    toServer: (list) => ({ quests: list }),
  });

  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(loadViewPref);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [editingDeps, setEditingDeps] = useState([]);

  const setViewPersisted = (next) => {
    setView(next);
    prefSet(VIEW_PREF_KEY, next);
  };

  const counts = useMemo(() => {
    const done = value.filter((quest) => quest.isDone).length;
    return { done, open: value.length - done, total: value.length };
  }, [value]);

  const visible = value.filter((quest) =>
    filter === 'all'
      ? true
      : filter === 'open'
        ? !quest.isDone
        : quest.isDone
  );

  const sortable = useSortable(value, save);
  const canReorder = filter === 'all' && value.length > 1;

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    save([
      ...value,
      { id: uid(), title, notes: '', isDone: false, dependsOn: [] },
    ]);
    setDraft('');
  };

  const toggle = (id) => {
    const quest = value.find((q) => q.id === id);
    if (!quest) return;
    // Players cannot tick a blocked quest off; toggling done back to open
    // is always allowed so a mistaken completion can be undone.
    if (!quest.isDone && !questIsUnlocked(quest, value)) return;
    save(
      value.map((q) =>
        q.id === id ? { ...q, isDone: !q.isDone } : q
      )
    );
  };

  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    save(value.filter((quest) => quest.id !== id));
  };

  const beginEdit = (quest) => {
    setEditingId(quest.id);
    setEditingTitle(quest.title);
    setEditingNotes(quest.notes);
    setEditingDeps(quest.dependsOn || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingNotes('');
    setEditingDeps([]);
  };

  const commitEdit = () => {
    const title = editingTitle.trim();
    if (!title) {
      cancelEdit();
      return;
    }
    save(
      value.map((quest) =>
        quest.id === editingId
          ? {
            ...quest,
            title,
            notes: editingNotes.trim(),
            dependsOn: editingDeps.filter((id) => id !== editingId),
          }
          : quest
      )
    );
    cancelEdit();
  };

  const toggleDep = (id) => {
    setEditingDeps((current) =>
      current.includes(id)
        ? current.filter((dep) => dep !== id)
        : [...current, id]
    );
  };

  const subtitle = loading
    ? 'Unfurling the writ…'
    : counts.total === 0
      ? 'No quests recorded'
      : `${counts.open} active · ${counts.done} completed`;

  return (
    <Panel
      icon={<IconQuest />}
      title="Quests"
      subtitle={subtitle}
      error={error}
      onRetry={reload}
      collapsibleKey="quests"
    >
      {loading ? (
        <Skeleton height="10rem" />
      ) : (
        <div className={styles.quests}>
          <div className={styles.add}>
            <TextInput
              value={draft}
              placeholder="Take up a new quest…"
              aria-label="New quest"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button kind="gold" onClick={add}>
              <IconPlus />
              Pledge
            </Button>
          </div>

          {value.length > 0 && (
            <div className={styles.viewToggle} role="group" aria-label="Quests view">
              <button
                type="button"
                className={cx(styles.viewOption, { [styles.viewOptionActive]: view === 'list' })}
                onClick={() => setViewPersisted('list')}
                aria-pressed={view === 'list'}
              >
                List
              </button>
              <button
                type="button"
                className={cx(styles.viewOption, { [styles.viewOptionActive]: view === 'graph' })}
                onClick={() => setViewPersisted('graph')}
                aria-pressed={view === 'graph'}
              >
                Graph
              </button>
            </div>
          )}

          {value.length > 0 && view === 'list' && (
            <div className={styles.filters} role="group" aria-label="Filter quests">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cx(styles.filter, {
                    [styles.filterActive]: filter === option.id,
                  })}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {value.length > 0 && view === 'graph' && (
            <QuestGraph quests={value} />
          )}

          {value.length === 0 ? (
            <p className={styles.empty}>
              No quests yet. Pledge one when an errand finds the party.
            </p>
          ) : view === 'graph' ? null : visible.length === 0 ? (
            <p className={styles.empty}>
              {filter === 'done'
                ? 'No quests have been completed yet.'
                : 'Every pledge has been fulfilled.'}
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((quest) => {
                const isEditing = editingId === quest.id;
                const fullIndex = value.indexOf(quest);
                const isDragging = canReorder && sortable.dragIndex === fullIndex;
                const isOver = canReorder && sortable.overIndex === fullIndex && !isDragging;
                const isLocked = !quest.isDone && !questIsUnlocked(quest, value);
                const blockingParents = (quest.dependsOn || [])
                  .map((id) => value.find((q) => q.id === id))
                  .filter((q) => q && !q.isDone);
                return (
                  <li
                    key={quest.id}
                    {...(canReorder ? sortable.getItemProps(fullIndex) : {})}
                    className={cx(styles.entry, {
                      [styles.entryDone]: quest.isDone,
                      [styles.entryEditing]: isEditing,
                      [styles.entryDragging]: isDragging,
                      [styles.entryDropOver]: isOver,
                      [styles.entryLocked]: isLocked,
                    })}
                  >
                    {canReorder && !isEditing && (
                      <span
                        {...sortable.getHandleProps(fullIndex, quest.title)}
                        className={styles.grip}
                      >
                        <IconGrip />
                      </span>
                    )}
                    {isEditing ? (
                      <div className={styles.editor}>
                        <TextInput
                          value={editingTitle}
                          aria-label="Quest title"
                          placeholder="Quest title"
                          onChange={(event) => setEditingTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              commitEdit();
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              cancelEdit();
                            }
                          }}
                        />
                        <textarea
                          className={styles.notes}
                          value={editingNotes}
                          rows={2}
                          placeholder="Details, hooks, gossip…"
                          aria-label="Quest notes"
                          onChange={(event) => setEditingNotes(event.target.value)}
                        />
                        {value.some((other) => other.id !== quest.id) && (
                          <div
                            className={styles.depEditor}
                            role="group"
                            aria-label="This quest is blocked until"
                          >
                            <span className={styles.depLabel}>Blocked until…</span>
                            <ul className={styles.depList}>
                              {value
                                .filter((other) => other.id !== quest.id)
                                .map((other) => {
                                  const checked = editingDeps.includes(other.id);
                                  return (
                                    <li key={other.id}>
                                      <label className={styles.depItem}>
                                        <input
                                          type="checkbox"
                                          className={styles.depCheckbox}
                                          checked={checked}
                                          onChange={() => toggleDep(other.id)}
                                        />
                                        <span
                                          className={cx(styles.depTitle, {
                                            [styles.depTitleDone]: other.isDone,
                                          })}
                                        >
                                          {other.title}
                                        </span>
                                        {other.isDone && (
                                          <span className={styles.depDone}>done</span>
                                        )}
                                      </label>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        )}
                        <div className={styles.editorActions}>
                          <Button kind="ghost" size="sm" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button kind="gold" size="sm" onClick={commitEdit}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.checkbox}
                          onClick={() => toggle(quest.id)}
                          aria-pressed={quest.isDone}
                          disabled={isLocked}
                          aria-label={
                            isLocked
                              ? `${quest.title} is blocked by ${blockingParents
                                .map((p) => p.title)
                                .join(', ')}`
                              : `Mark ${quest.title} as ${
                                quest.isDone ? 'active' : 'completed'
                              }`
                          }
                          title={
                            isLocked
                              ? `Blocked until: ${blockingParents
                                .map((p) => p.title)
                                .join(', ')}`
                              : undefined
                          }
                        >
                          {quest.isDone ? (
                            <IconCheck />
                          ) : isLocked ? (
                            <IconLock />
                          ) : null}
                        </button>
                        <div className={styles.body}>
                          <p className={styles.title}>{quest.title}</p>
                          {isLocked && blockingParents.length > 0 && (
                            <p className={styles.depHint}>
                              Blocked until {blockingParents.length === 1
                                ? '“'
                                : ''}
                              {blockingParents.map((p, i) => (
                                <span key={p.id}>
                                  {i > 0 && ', '}
                                  <span className={styles.depHintTitle}>
                                    {p.title}
                                  </span>
                                </span>
                              ))}
                              {blockingParents.length === 1 ? '”' : ''}
                            </p>
                          )}
                          {quest.notes && (
                            <FormattedText
                              className={styles.detail}
                              text={quest.notes}
                            />
                          )}
                        </div>
                        <div className={styles.entryActions}>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Edit ${quest.title}`}
                            onClick={() => beginEdit(quest)}
                          >
                            <IconPencil />
                          </Button>
                          <Button
                            kind="danger"
                            size="sm"
                            iconOnly
                            aria-label={`Remove ${quest.title}`}
                            onClick={() => remove(quest.id)}
                          >
                            <IconTrash />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
};

export default Quests;
