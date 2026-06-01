import { PanelReorderContext } from '../common/Panel/reorderContext';
import {
  usePanelReorder,
  reconcilePanelOrder,
} from '../common/Panel/usePanelReorder';
import { NOTEBOOK_PANELS } from '../../appSections';
import styles from './Notebook.module.scss';

export const ORDER_PREF_KEY = 'notebook-order';

// Kept for backward-compatible imports/tests; delegates to the shared engine.
export const reconcileOrder = (stored) =>
  reconcilePanelOrder(
    stored,
    NOTEBOOK_PANELS.map((panel) => panel.key)
  );

// The notebook grid of story ledgers, rendered in a player-chosen order that
// persists per device. Each panel grows its own drag handle (supplied through
// PanelReorderContext) so the panels themselves stay unaware of reordering.
const Notebook = () => {
  const { order, panelsByKey, handles } = usePanelReorder(
    NOTEBOOK_PANELS,
    ORDER_PREF_KEY
  );

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
