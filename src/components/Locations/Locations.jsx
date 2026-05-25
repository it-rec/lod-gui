import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconMap,
  IconPlus,
  IconTrash,
  IconPencil,
  IconGrip,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { useSortable } from '../../hooks/useSortable';
import { collections } from '../../shared';
import styles from './Locations.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `loc-${Math.random().toString(36).slice(2, 10)}`;

// Order matters: clicking the inline badge cycles forward, so the sequence
// reflects a place's natural arc — heard about, then visited, then maybe
// settled in, then finally lost behind the party.
const STATUSES = [
  { id: 'rumored', label: 'Rumored' },
  { id: 'visited', label: 'Visited' },
  { id: 'home', label: 'Home' },
  { id: 'lost', label: 'Lost' },
];
const STATUS_IDS = STATUSES.map((status) => status.id);

// Tolerates a few legacy shapes: a bare string becomes a rumored landmark;
// missing or unrecognised status falls back to "rumored".
const normalizeLocations = (raw) => {
  const list = Array.isArray(raw?.locations)
    ? raw.locations
    : Array.isArray(raw)
      ? raw
      : [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name
          ? { id: uid(), name, status: 'rumored', region: '', notes: '' }
          : null;
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.name === 'string' &&
        entry.name.trim()
      ) {
        return {
          id: entry.id || uid(),
          name: entry.name.trim(),
          status: STATUS_IDS.includes(entry.status) ? entry.status : 'rumored',
          region: typeof entry.region === 'string' ? entry.region : '',
          notes: typeof entry.notes === 'string' ? entry.notes : '',
        };
      }
      return null;
    })
    .filter(Boolean);
};

const FILTERS = [{ id: 'all', label: 'All' }, ...STATUSES];

const Locations = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.LOCATIONS,
    path: '/api/game/1/locations/',
    initial: [],
    fromServer: normalizeLocations,
    toServer: (list) => ({ locations: list }),
  });

  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingStatus, setEditingStatus] = useState('rumored');
  const [editingRegion, setEditingRegion] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_IDS.map((id) => [id, 0]));
    value.forEach((location) => {
      byStatus[location.status] = (byStatus[location.status] || 0) + 1;
    });
    return byStatus;
  }, [value]);

  const visible = value.filter((location) =>
    filter === 'all' ? true : location.status === filter
  );

  const sortable = useSortable(value, save);
  const canReorder = filter === 'all' && value.length > 1;

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    save([
      ...value,
      { id: uid(), name, status: 'rumored', region: '', notes: '' },
    ]);
    setDraft('');
  };

  const cycleStatus = (id) =>
    save(
      value.map((location) => {
        if (location.id !== id) return location;
        const next =
          STATUS_IDS[(STATUS_IDS.indexOf(location.status) + 1) % STATUS_IDS.length];
        return { ...location, status: next };
      })
    );

  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    save(value.filter((location) => location.id !== id));
  };

  const beginEdit = (location) => {
    setEditingId(location.id);
    setEditingName(location.name);
    setEditingStatus(location.status);
    setEditingRegion(location.region);
    setEditingNotes(location.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingStatus('rumored');
    setEditingRegion('');
    setEditingNotes('');
  };

  const commitEdit = () => {
    const name = editingName.trim();
    if (!name) {
      cancelEdit();
      return;
    }
    save(
      value.map((location) =>
        location.id === editingId
          ? {
            ...location,
            name,
            status: editingStatus,
            region: editingRegion.trim(),
            notes: editingNotes.trim(),
          }
          : location
      )
    );
    cancelEdit();
  };

  const total = value.length;
  const visited = counts.visited || 0;
  const subtitle = loading
    ? 'Unfolding the map…'
    : total === 0
      ? 'No places marked on the map'
      : visited > 0
        ? `${total} ${total === 1 ? 'place' : 'places'} · ${visited} visited`
        : `${total} ${total === 1 ? 'place' : 'places'}`;

  return (
    <Panel
      icon={<IconMap />}
      title="Locations"
      subtitle={subtitle}
      error={error}
      onRetry={reload}
      collapsibleKey="locations"
    >
      {loading ? (
        <Skeleton height="10rem" />
      ) : (
        <div className={styles.locations}>
          <div className={styles.add}>
            <TextInput
              value={draft}
              placeholder="Mark a place on the map…"
              aria-label="New location"
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
              Mark
            </Button>
          </div>

          {value.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filter locations">
              {FILTERS.map((option) => {
                const count = option.id === 'all' ? total : counts[option.id] || 0;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cx(styles.filter, {
                      [styles.filterActive]: filter === option.id,
                    })}
                    onClick={() => setFilter(option.id)}
                  >
                    {option.label}
                    <span className={styles.filterCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {value.length === 0 ? (
            <p className={styles.empty}>
              No places yet. Mark the towns, ruins and roads the party will tread.
            </p>
          ) : visible.length === 0 ? (
            <p className={styles.empty}>
              No places match this filter.
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((location) => {
                const isEditing = editingId === location.id;
                const fullIndex = value.indexOf(location);
                const isDragging = canReorder && sortable.dragIndex === fullIndex;
                const isOver =
                  canReorder && sortable.overIndex === fullIndex && !isDragging;
                return (
                  <li
                    key={location.id}
                    {...(canReorder ? sortable.getItemProps(fullIndex) : {})}
                    className={cx(
                      styles.entry,
                      styles[`entry-${location.status}`],
                      {
                        [styles.entryEditing]: isEditing,
                        [styles.entryDragging]: isDragging,
                        [styles.entryDropOver]: isOver,
                      }
                    )}
                  >
                    {canReorder && !isEditing && (
                      <span
                        {...sortable.getHandleProps(fullIndex, location.name)}
                        className={styles.grip}
                      >
                        <IconGrip />
                      </span>
                    )}
                    {isEditing ? (
                      <div className={styles.editor}>
                        <TextInput
                          value={editingName}
                          aria-label="Place name"
                          placeholder="Name"
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              cancelEdit();
                            }
                          }}
                        />
                        <div
                          className={styles.statusSelect}
                          role="group"
                          aria-label="Status"
                        >
                          {STATUSES.map((status) => (
                            <button
                              key={status.id}
                              type="button"
                              className={cx(
                                styles.statusOption,
                                styles[`statusOption-${status.id}`],
                                { [styles.statusOptionActive]: editingStatus === status.id }
                              )}
                              onClick={() => setEditingStatus(status.id)}
                              aria-pressed={editingStatus === status.id}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                        <TextInput
                          value={editingRegion}
                          aria-label="Region"
                          placeholder="Region (optional)"
                          variant="sm"
                          onChange={(event) => setEditingRegion(event.target.value)}
                        />
                        <textarea
                          className={styles.notes}
                          value={editingNotes}
                          rows={2}
                          placeholder="What's there, who lives, what waits…"
                          aria-label="Place notes"
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
                          className={cx(
                            styles.statusBadge,
                            styles[`statusBadge-${location.status}`]
                          )}
                          onClick={() => cycleStatus(location.id)}
                          aria-label={`${location.name} — status ${location.status}, click to change`}
                          title="Click to cycle status"
                        >
                          {STATUSES.find((s) => s.id === location.status).label}
                        </button>
                        <div className={styles.body}>
                          <p className={styles.name}>{location.name}</p>
                          {location.region && (
                            <p className={styles.region}>{location.region}</p>
                          )}
                          {location.notes && (
                            <FormattedText
                              className={styles.detail}
                              text={location.notes}
                            />
                          )}
                        </div>
                        <div className={styles.entryActions}>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Edit ${location.name}`}
                            onClick={() => beginEdit(location)}
                          >
                            <IconPencil />
                          </Button>
                          <Button
                            kind="danger"
                            size="sm"
                            iconOnly
                            aria-label={`Remove ${location.name}`}
                            onClick={() => remove(location.id)}
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

export default Locations;
