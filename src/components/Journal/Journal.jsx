import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconScroll,
  IconPlus,
  IconTrash,
  IconPencil,
  IconSearch,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { usePlayerName } from '../../hooks/usePlayerName';
import { collections, gamePath } from '../../shared';
import { removeWithUndo } from '../../utils/undoRemove';
import styles from './Journal.module.scss';
import { makeUid } from '../../utils/uid';

const uid = () => makeUid('jnl');

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
        author:
          typeof entry.author === 'string' ? entry.author.trim() : '',
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
    path: gamePath('journal'),
    initial: [],
    fromServer: normalizeEntries,
    toServer: (list) => ({ entries: list }),
  });

  // Mirror the calendar so new entries default to "today" without coupling
  // to it for layout. If the calendar fetch fails the journal still works
  // — just with day 1 as the default.
  const { value: calendar } = useGameChannel({
    channel: collections.CALENDAR,
    path: gamePath('calendar'),
    initial: { day: 1, time: 'morning' },
    fromServer: (raw) => ({
      day: Number.isFinite(raw?.day) && raw.day > 0 ? Math.round(raw.day) : 1,
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
    }),
  });

  const { name: playerName } = usePlayerName();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // The journal only grows over a campaign, so it gets the same quick text
  // filter the keywords list has — matching entry text and author.
  const trimmedQuery = query.trim().toLowerCase();
  const visibleEntries = useMemo(
    () =>
      trimmedQuery
        ? entries.filter(
          (entry) =>
            entry.text.toLowerCase().includes(trimmedQuery) ||
            entry.author.toLowerCase().includes(trimmedQuery)
        )
        : entries,
    [entries, trimmedQuery]
  );

  const grouped = useMemo(() => {
    // Group by day descending. Within a day, sort by phase order, then by
    // creation time — the most recent entries surface to the top.
    const byDay = new Map();
    visibleEntries.forEach((entry) => {
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
  }, [visibleEntries]);

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
        author: playerName.trim(),
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
    const target = entries.find((entry) => entry.id === id);
    const firstLine = target?.text.split('\n')[0] ?? '';
    removeWithUndo({
      list: entries,
      id,
      save,
      label: firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine,
      noun: 'Journal entry',
    });
  };

  const total = entries.length;
  // Count days from the full list, not the filtered grouping, so the subtitle
  // stays stable while a search narrows the view.
  const dayCount = useMemo(
    () => new Set(entries.map((entry) => entry.day)).size,
    [entries]
  );
  const subtitle = loading
    ? 'Unrolling the chronicle…'
    : total === 0
      ? 'No entries recorded'
      : `${total} ${total === 1 ? 'entry' : 'entries'} across ${dayCount} ${dayCount === 1 ? 'day' : 'days'}`;

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

          {total > 3 && (
            <label className={styles.search}>
              <IconSearch className={styles.searchIcon} aria-hidden="true" />
              <TextInput
                variant="sm"
                value={query}
                placeholder="Search entries or authors…"
                aria-label="Search journal entries"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          )}

          {total === 0 ? (
            <p className={styles.empty}>
              No entries yet. When the day ends, write down what passed.
            </p>
          ) : grouped.length === 0 ? (
            <p className={styles.empty}>
              No entries match &ldquo;{query.trim()}&rdquo;.
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
                                {entry.author && (
                                  <span className={styles.entryAuthor}>
                                    {entry.author}
                                  </span>
                                )}
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
