import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconPeople,
  IconPlus,
  IconTrash,
  IconPencil,
  IconGrip,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { useSortable } from '../../hooks/useSortable';
import { collections, gamePath } from '../../shared';
import styles from './NPCs.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `npc-${Math.random().toString(36).slice(2, 10)}`;

const ROLES = [
  { id: 'ally', label: 'Ally' },
  { id: 'foe', label: 'Foe' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'unknown', label: 'Unknown' },
];
const ROLE_IDS = ROLES.map((role) => role.id);

const normalizeNpcs = (raw) => {
  const list = Array.isArray(raw?.npcs)
    ? raw.npcs
    : Array.isArray(raw)
      ? raw
      : [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name
          ? { id: uid(), name, role: 'unknown', location: '', notes: '' }
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
          role: ROLE_IDS.includes(entry.role) ? entry.role : 'unknown',
          location: typeof entry.location === 'string' ? entry.location : '',
          notes: typeof entry.notes === 'string' ? entry.notes : '',
        };
      }
      return null;
    })
    .filter(Boolean);
};

const FILTERS = [{ id: 'all', label: 'All' }, ...ROLES];

const NPCs = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.NPCS,
    path: gamePath('npcs'),
    initial: [],
    fromServer: normalizeNpcs,
    toServer: (list) => ({ npcs: list }),
  });

  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingRole, setEditingRole] = useState('unknown');
  const [editingLocation, setEditingLocation] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  const counts = useMemo(() => {
    const byRole = Object.fromEntries(ROLE_IDS.map((id) => [id, 0]));
    value.forEach((npc) => {
      byRole[npc.role] = (byRole[npc.role] || 0) + 1;
    });
    return byRole;
  }, [value]);

  const visible = value.filter((npc) =>
    filter === 'all' ? true : npc.role === filter
  );

  const sortable = useSortable(value, save);
  const canReorder = filter === 'all' && value.length > 1;

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    save([
      ...value,
      { id: uid(), name, role: 'unknown', location: '', notes: '' },
    ]);
    setDraft('');
  };

  const cycleRole = (id) =>
    save(
      value.map((npc) => {
        if (npc.id !== id) return npc;
        const next = ROLE_IDS[(ROLE_IDS.indexOf(npc.role) + 1) % ROLE_IDS.length];
        return { ...npc, role: next };
      })
    );

  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    save(value.filter((npc) => npc.id !== id));
  };

  const beginEdit = (npc) => {
    setEditingId(npc.id);
    setEditingName(npc.name);
    setEditingRole(npc.role);
    setEditingLocation(npc.location);
    setEditingNotes(npc.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingRole('unknown');
    setEditingLocation('');
    setEditingNotes('');
  };

  const commitEdit = () => {
    const name = editingName.trim();
    if (!name) {
      cancelEdit();
      return;
    }
    save(
      value.map((npc) =>
        npc.id === editingId
          ? {
            ...npc,
            name,
            role: editingRole,
            location: editingLocation.trim(),
            notes: editingNotes.trim(),
          }
          : npc
      )
    );
    cancelEdit();
  };

  const total = value.length;
  const subtitle = loading
    ? 'Recalling familiar faces…'
    : total === 0
      ? 'No notable faces recorded'
      : `${total} ${total === 1 ? 'name' : 'names'} in the ledger`;

  return (
    <Panel
      icon={<IconPeople />}
      title="People"
      subtitle={subtitle}
      error={error}
      onRetry={reload}
      collapsibleKey="people"
    >
      {loading ? (
        <Skeleton height="10rem" />
      ) : (
        <div className={styles.npcs}>
          <div className={styles.add}>
            <TextInput
              value={draft}
              placeholder="Add a person you've met…"
              aria-label="New person"
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
              Note
            </Button>
          </div>

          {value.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filter people">
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
              No one yet. Add the villagers, foes and strangers the party meets.
            </p>
          ) : visible.length === 0 ? (
            <p className={styles.empty}>
              No one matches this filter.
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((npc) => {
                const isEditing = editingId === npc.id;
                const fullIndex = value.indexOf(npc);
                const isDragging = canReorder && sortable.dragIndex === fullIndex;
                const isOver =
                  canReorder && sortable.overIndex === fullIndex && !isDragging;
                return (
                  <li
                    key={npc.id}
                    {...(canReorder ? sortable.getItemProps(fullIndex) : {})}
                    className={cx(
                      styles.entry,
                      styles[`entry-${npc.role}`],
                      {
                        [styles.entryEditing]: isEditing,
                        [styles.entryDragging]: isDragging,
                        [styles.entryDropOver]: isOver,
                      }
                    )}
                  >
                    {canReorder && !isEditing && (
                      <span
                        {...sortable.getHandleProps(fullIndex, npc.name)}
                        className={styles.grip}
                      >
                        <IconGrip />
                      </span>
                    )}
                    {isEditing ? (
                      <div className={styles.editor}>
                        <TextInput
                          value={editingName}
                          aria-label="Person name"
                          placeholder="Name"
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              cancelEdit();
                            }
                          }}
                        />
                        <div className={styles.roleSelect} role="group" aria-label="Role">
                          {ROLES.map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              className={cx(
                                styles.roleOption,
                                styles[`roleOption-${role.id}`],
                                { [styles.roleOptionActive]: editingRole === role.id }
                              )}
                              onClick={() => setEditingRole(role.id)}
                              aria-pressed={editingRole === role.id}
                            >
                              {role.label}
                            </button>
                          ))}
                        </div>
                        <TextInput
                          value={editingLocation}
                          aria-label="Location"
                          placeholder="Where met (optional)"
                          variant="sm"
                          onChange={(event) => setEditingLocation(event.target.value)}
                        />
                        <textarea
                          className={styles.notes}
                          value={editingNotes}
                          rows={2}
                          placeholder="What they said, did, want…"
                          aria-label="Person notes"
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
                            styles.roleBadge,
                            styles[`roleBadge-${npc.role}`]
                          )}
                          onClick={() => cycleRole(npc.id)}
                          aria-label={`${npc.name} — role ${npc.role}, click to change`}
                          title="Click to cycle role"
                        >
                          {ROLES.find((r) => r.id === npc.role).label}
                        </button>
                        <div className={styles.body}>
                          <p className={styles.name}>{npc.name}</p>
                          {npc.location && (
                            <p className={styles.location}>{npc.location}</p>
                          )}
                          {npc.notes && (
                            <FormattedText
                              className={styles.detail}
                              text={npc.notes}
                            />
                          )}
                        </div>
                        <div className={styles.entryActions}>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Edit ${npc.name}`}
                            onClick={() => beginEdit(npc)}
                          >
                            <IconPencil />
                          </Button>
                          <Button
                            kind="danger"
                            size="sm"
                            iconOnly
                            aria-label={`Remove ${npc.name}`}
                            onClick={() => remove(npc.id)}
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

export default NPCs;
