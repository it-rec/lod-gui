import { useMemo, useState } from 'react';
import { useSortable } from '../../hooks/useSortable';
import { prefGet, prefSet } from '../../utils/localStorageUtil';
import { PanelReorderContext } from '../common/Panel/reorderContext';
import { NOTEBOOK_PANELS } from '../../appSections';
import styles from './Notebook.module.scss';

export const ORDER_PREF_KEY = 'notebook-order';

const VALID_KEYS = NOTEBOOK_PANELS.map((panel) => panel.key);

// Reconciles a stored order against the current registry: keeps known keys in
// the saved order, drops stale ones, and appends any panels added since the
// order was last saved. Always returns the full set exactly once.
export const reconcileOrder = (stored) => {
  const known = Array.isArray(stored)
    ? stored.filter((key) => VALID_KEYS.includes(key))
    : [];
  const missing = VALID_KEYS.filter((key) => !known.includes(key));
  return [...known, ...missing];
};

// The notebook grid of story ledgers, rendered in a player-chosen order that
// persists per device. Each panel grows its own drag handle (supplied through
// PanelReorderContext) so the panels themselves stay unaware of reordering.
const Notebook = () => {
  const [order, setOrder] = useState(() =>
    reconcileOrder(prefGet(ORDER_PREF_KEY))
  );

  const panelsByKey = useMemo(
    () => Object.fromEntries(NOTEBOOK_PANELS.map((panel) => [panel.key, panel])),
    []
  );

  const reorder = (next) => {
    setOrder(next);
    prefSet(ORDER_PREF_KEY, next);
  };

  const sortable = useSortable(order, reorder);

  // Publish per-key drag props the matching Panel will pick up from context.
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

  return (
    <PanelReorderContext.Provider value={handles}>
      <div className={styles.notebook}>
        {order.map((key) => {
          const panel = panelsByKey[key];
          if (!panel) return null;
          const { Component } = panel;
          return <Component key={key} />;
        })}
      </div>
    </PanelReorderContext.Provider>
  );
};

export default Notebook;
