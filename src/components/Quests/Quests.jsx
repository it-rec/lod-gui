import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconQuest,
  IconPlus,
  IconTrash,
  IconCheck,
  IconPencil,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import styles from './Quests.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `quest-${Math.random().toString(36).slice(2, 10)}`;

// Tolerates legacy strings, missing ids, and unexpected shapes — any saved
// quest record is upgraded into the current { id, title, notes, isDone } form.
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
        return title ? { id: uid(), title, notes: '', isDone: false } : null;
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.title === 'string' &&
        entry.title.trim()
      ) {
        return {
          id: entry.id || uid(),
          title: entry.title,
          notes: typeof entry.notes === 'string' ? entry.notes : '',
          isDone: Boolean(entry.isDone),
        };
      }
      return null;
    })
    .filter(Boolean);
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
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

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

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    save([...value, { id: uid(), title, notes: '', isDone: false }]);
    setDraft('');
  };

  const toggle = (id) =>
    save(
      value.map((quest) =>
        quest.id === id ? { ...quest, isDone: !quest.isDone } : quest
      )
    );

  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    save(value.filter((quest) => quest.id !== id));
  };

  const beginEdit = (quest) => {
    setEditingId(quest.id);
    setEditingTitle(quest.title);
    setEditingNotes(quest.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingNotes('');
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
          ? { ...quest, title, notes: editingNotes.trim() }
          : quest
      )
    );
    cancelEdit();
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

          {value.length === 0 ? (
            <p className={styles.empty}>
              No quests yet. Pledge one when an errand finds the party.
            </p>
          ) : visible.length === 0 ? (
            <p className={styles.empty}>
              {filter === 'done'
                ? 'No quests have been completed yet.'
                : 'Every pledge has been fulfilled.'}
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((quest) => {
                const isEditing = editingId === quest.id;
                return (
                  <li
                    key={quest.id}
                    className={cx(styles.entry, {
                      [styles.entryDone]: quest.isDone,
                      [styles.entryEditing]: isEditing,
                    })}
                  >
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
                          aria-label={`Mark ${quest.title} as ${
                            quest.isDone ? 'active' : 'completed'
                          }`}
                        >
                          {quest.isDone && <IconCheck />}
                        </button>
                        <div className={styles.body}>
                          <p className={styles.title}>{quest.title}</p>
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
