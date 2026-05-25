import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconScroll,
  IconPlus,
  IconTrash,
  IconPencil,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import styles from './Journal.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `jnl-${Math.random().toString(36).slice(2, 10)}`;

const PHASE_IDS = ['morning', 'afternoon', 'evening', 'night'];

const normalizeEntries = (raw) => {
  const list = Array.isArray(raw?.entries)
    ? raw.entries
    : Array.isArray(raw)
      ? raw
      : [];
  return list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const text = typeof entry.text === 'string' ? entry.text : '';
      if (!text.trim()) return null;
      return {
        id: entry.id || uid(),
        day:
          Number.isFinite(entry.day) && entry.day > 0
            ? Math.round(entry.day)
            : 1,
        time: PHASE_IDS.includes(entry.time) ? entry.time : null,
        text: text.trim(),
        createdAt:
          typeof entry.createdAt === 'string'
            ? entry.createdAt
            : new Date().toISOString(),
      };
    })
    .filter(Boolean);
};

const PHASE_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const Journal = () => {
  const { value: entries, save, loading, error, reload } = useGameChannel({
    channel: collections.JOURNAL,
    path: '/api/game/1/journal/',
    initial: [],
    fromServer: normalizeEntries,
    toServer: (list) => ({ entries: list }),
  });

  // Mirror the calendar so new entries default to "today" without coupling
  // to it for layout. If the calendar fetch fails the journal still works
  // — just with day 1 as the default.
  const { value: calendar } = useGameChannel({
    channel: collections.CALENDAR,
    path: '/api/game/1/calendar/',
    initial: { day: 1, time: 'morning' },
    fromServer: (raw) => ({
      day: Number.isFinite(raw?.day) && raw.day > 0 ? Math.round(raw.day) : 1,
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
    }),
  });

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const grouped = useMemo(() => {
    // Group by day descending. Within a day, sort by phase order, then by
    // creation time — the most recent entries surface to the top.
    const byDay = new Map();
    entries.forEach((entry) => {
      if (!byDay.has(entry.day)) byDay.set(entry.day, []);
      byDay.get(entry.day).push(entry);
    });
    const phaseRank = (id) => {
      const idx = PHASE_IDS.indexOf(id);
      return idx === -1 ? PHASE_IDS.length : idx;
    };
    const days = Array.from(byDay.entries()).sort(([a], [b]) => b - a);
    days.forEach(([, list]) => {
      list.sort((a, b) => {
        const phase = phaseRank(b.time) - phaseRank(a.time);
        if (phase !== 0) return phase;
        return b.createdAt.localeCompare(a.createdAt);
      });
    });
    return days;
  }, [entries]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    save([
      ...entries,
      {
        id: uid(),
        day: calendar.day,
        time: calendar.time,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
  };

  const beginEdit = (entry) => {
    setEditingId(entry.id);
    setEditingText(entry.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const commitEdit = () => {
    const text = editingText.trim();
    if (!text) {
      cancelEdit();
      return;
    }
    save(
      entries.map((entry) =>
        entry.id === editingId ? { ...entry, text } : entry
      )
    );
    cancelEdit();
  };

  const remove = (id) => {
    if (editingId === id) cancelEdit();
    save(entries.filter((entry) => entry.id !== id));
  };

  const total = entries.length;
  const subtitle = loading
    ? 'Unrolling the chronicle…'
    : total === 0
      ? 'No entries recorded'
      : `${total} ${total === 1 ? 'entry' : 'entries'} across ${grouped.length} ${grouped.length === 1 ? 'day' : 'days'}`;

  return (
    <Panel
      icon={<IconScroll />}
      title="Session Journal"
      subtitle={subtitle}
      error={error}
      onRetry={reload}
      collapsibleKey="journal"
    >
      {loading ? (
        <Skeleton height="10rem" />
      ) : (
        <div className={styles.journal}>
          <div className={styles.compose}>
            <span className={styles.composeStamp}>
              Day {calendar.day}
              {calendar.time && ` · ${PHASE_LABELS[calendar.time]}`}
            </span>
            <textarea
              className={styles.textarea}
              value={draft}
              rows={3}
              placeholder="What happened, what was said, what they swore…"
              aria-label="New journal entry"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <div className={styles.composeActions}>
              <span className={styles.hint}>
                Markdown welcome · ⌘/Ctrl + Enter to record
              </span>
              <Button
                kind="gold"
                onClick={add}
                disabled={!draft.trim()}
              >
                <IconPlus />
                Record
              </Button>
            </div>
          </div>

          {grouped.length === 0 ? (
            <p className={styles.empty}>
              No entries yet. When the day ends, write down what passed.
            </p>
          ) : (
            <ol className={styles.days}>
              {grouped.map(([day, list]) => (
                <li key={day} className={styles.day}>
                  <div className={styles.dayHead}>
                    <span className={styles.dayLabel}>Day {day}</span>
                    <span className={styles.dayCount}>
                      {list.length} {list.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <ul className={styles.entries}>
                    {list.map((entry) => {
                      const isEditing = editingId === entry.id;
                      return (
                        <li
                          key={entry.id}
                          className={cx(styles.entry, {
                            [styles.entryEditing]: isEditing,
                          })}
                        >
                          {isEditing ? (
                            <div className={styles.editor}>
                              <textarea
                                className={styles.textarea}
                                value={editingText}
                                rows={3}
                                aria-label="Edit journal entry"
                                onChange={(event) =>
                                  setEditingText(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelEdit();
                                  }
                                  if (
                                    event.key === 'Enter' &&
                                    (event.ctrlKey || event.metaKey)
                                  ) {
                                    event.preventDefault();
                                    commitEdit();
                                  }
                                }}
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
                              <span className={styles.entryStamp}>
                                {entry.time
                                  ? PHASE_LABELS[entry.time]
                                  : 'Anytime'}
                              </span>
                              <FormattedText
                                className={styles.entryBody}
                                text={entry.text}
                              />
                              <div className={styles.entryActions}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  iconOnly
                                  aria-label="Edit journal entry"
                                  onClick={() => beginEdit(entry)}
                                >
                                  <IconPencil />
                                </Button>
                                <Button
                                  kind="danger"
                                  size="sm"
                                  iconOnly
                                  aria-label="Remove journal entry"
                                  onClick={() => remove(entry.id)}
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
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Panel>
  );
};

export default Journal;
