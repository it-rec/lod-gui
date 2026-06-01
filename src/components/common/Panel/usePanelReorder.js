import { useMemo, useState } from 'react';
import { useSortable } from '../../../hooks/useSortable';
import { prefGet, prefSet } from '../../../utils/localStorageUtil';

// Reconciles a stored order against a registry: keeps known keys in the saved
// order, drops stale ones, and appends any panels added since the order was
// last saved. Always returns the full set exactly once.
export const reconcilePanelOrder = (stored, validKeys) => {
  const known = Array.isArray(stored)
    ? stored.filter((key) => validKeys.includes(key))
    : [];
  const missing = validKeys.filter((key) => !known.includes(key));
  return [...known, ...missing];
};

// Shared engine for a reorderable panel group: owns the persisted order and
// turns it into the per-key drag props each Panel picks up from
// PanelReorderContext. Used by every group (the notebook grid, the field
// stack) so the wiring lives in one place.
export const usePanelReorder = (panels, prefKey) => {
  const validKeys = useMemo(() => panels.map((panel) => panel.key), [panels]);
  const panelsByKey = useMemo(
    () => Object.fromEntries(panels.map((panel) => [panel.key, panel])),
    [panels]
  );

  const [order, setOrder] = useState(() =>
    reconcilePanelOrder(prefGet(prefKey), validKeys)
  );

  const reorder = (next) => {
    setOrder(next);
    prefSet(prefKey, next);
  };

  const sortable = useSortable(order, reorder);

  const handles = useMemo(() => {
    const map = {};
    order.forEach((key, index) => {
      const panel = panelsByKey[key];
      if (!panel) return;
      map[key] = {
        itemProps: sortable.getItemProps(index),
        handleProps: sortable.getHandleProps(index, panel.label),
        isDragging: sortable.dragIndex === index,
        isOver: sortable.overIndex === index && sortable.dragIndex !== index,
      };
    });
    return map;
  }, [order, panelsByKey, sortable]);

  return { order, panelsByKey, handles };
};
