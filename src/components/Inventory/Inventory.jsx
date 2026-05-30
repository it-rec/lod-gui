import { useMemo, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import FormattedText from '../common/FormattedText/FormattedText';
import {
  IconChest,
  IconPlus,
  IconTrash,
  IconPencil,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections, gamePath } from '../../shared';
import styles from './Inventory.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `it-${Math.random().toString(36).slice(2, 10)}`;

const clampQty = (n) => {
  const num = Number.parseInt(n, 10);
  if (!Number.isFinite(num)) return 1;
  return Math.max(1, Math.min(9999, num));
};

const normalizeInventory = (raw) => {
  const items = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
      ? raw
      : [];
  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const name = typeof entry.name === 'string' ? entry.name.trim() : '';
      if (!name) return null;
      return {
        id: entry.id || uid(),
        name,
        quantity: clampQty(entry.quantity ?? 1),
        notes: typeof entry.notes === 'string' ? entry.notes : '',
        holder: typeof entry.holder === 'string' ? entry.holder.trim() : '',
      };
    })
    .filter(Boolean);
};

const Inventory = () => {
  const { value: items, save, loading, error, reload } = useGameChannel({
    channel: collections.INVENTORY,
    path: gamePath('inventory'),
    initial: [],
    fromServer: normalizeInventory,
    toServer: (list) => ({ items: list }),
  });

  const [draftName, setDraftName] = useState('');
  const [draftQty, setDraftQty] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [editingHolder, setEditingHolder] = useState('');

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const add = () => {
    const name = draftName.trim();
    if (!name) return;
    save([
      ...items,
      {
        id: uid(),
        name,
        quantity: draftQty.trim() ? clampQty(draftQty) : 1,
        notes: '',
        holder: '',
      },
    ]);
    setDraftName('');
    setDraftQty('');
  };

  const setQuantity = (id, delta) => {
    save(
      items
        .map((item) => {
          if (item.id !== id) return item;
          const next = item.quantity + delta;
          return { ...item, quantity: Math.max(0, Math.min(9999, next)) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    save(items.filter((item) => item.id !== id));
  };

  const beginEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingNotes(item.notes);
    setEditingHolder(item.holder);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingNotes('');
    setEditingHolder('');
  };

  const commitEdit = () => {
    const name = editingName.trim();
    if (!name) {
      cancelEdit();
      return;
    }
    save(
      items.map((item) =>
        item.id === editingId
          ? {
            ...item,
            name,
            notes: editingNotes.trim(),
            holder: editingHolder.trim(),
          }
          : item
      )
    );
    cancelEdit();
  };

  const subtitle = loading
    ? 'Counting coppers…'
    : items.length === 0
      ? 'No spoils gathered'
      : `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${totalItems} total`;

  return (
    <Panel
      icon={<IconChest />}
      title="Treasure"
      subtitle={subtitle}
      error={error}
      onRetry={reload}
      collapsibleKey="inventory"
      defaultCollapsed
    >
      {loading ? (
        <Skeleton height="8rem" />
      ) : (
        <div className={styles.inventory}>
          <div className={styles.add}>
            <TextInput
              value={draftName}
              placeholder="Item or gift"
              aria-label="New item name"
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <TextInput
              value={draftQty}
              placeholder="Qty"
              aria-label="Item quantity"
              type="number"
              className={styles.qtyInput}
              onChange={(event) => setDraftQty(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button kind="gold" onClick={add} disabled={!draftName.trim()}>
              <IconPlus />
              Stow
            </Button>
          </div>

          {items.length === 0 ? (
            <p className={styles.empty}>
              No spoils yet. When the party finds gold, gear, or gifts,
              stow them here so the GM and the players can both see.
            </p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <li
                    key={item.id}
                    className={cx(styles.entry, {
                      [styles.entryEditing]: isEditing,
                    })}
                  >
                    {isEditing ? (
                      <div className={styles.editor}>
                        <TextInput
                          value={editingName}
                          aria-label="Item name"
                          placeholder="Item name"
                          onChange={(event) => setEditingName(event.target.value)}
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
                        <TextInput
                          value={editingHolder}
                          aria-label="Carried by"
                          placeholder="Carried by (hero name)"
                          onChange={(event) => setEditingHolder(event.target.value)}
                        />
                        <textarea
                          className={styles.notes}
                          value={editingNotes}
                          rows={2}
                          placeholder="What it does, who gave it…"
                          aria-label="Item notes"
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
                        <div className={styles.qty}>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Take 1 from ${item.name}`}
                            onClick={() => setQuantity(item.id, -1)}
                          >
                            −
                          </Button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Add 1 to ${item.name}`}
                            onClick={() => setQuantity(item.id, +1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className={styles.body}>
                          <p className={styles.name}>{item.name}</p>
                          {item.holder && (
                            <p className={styles.holder}>
                              <span className={styles.holderLabel}>Carried by</span>
                              {item.holder}
                            </p>
                          )}
                          {item.notes && (
                            <FormattedText
                              className={styles.detail}
                              text={item.notes}
                            />
                          )}
                        </div>
                        <div className={styles.entryActions}>
                          <Button
                            kind="ghost"
                            size="sm"
                            iconOnly
                            aria-label={`Edit ${item.name}`}
                            onClick={() => beginEdit(item)}
                          >
                            <IconPencil />
                          </Button>
                          <Button
                            kind="danger"
                            size="sm"
                            iconOnly
                            aria-label={`Discard ${item.name}`}
                            onClick={() => remove(item.id)}
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

export default Inventory;
