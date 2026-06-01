import { PanelReorderContext } from '../common/Panel/reorderContext';
import { usePanelReorder } from '../common/Panel/usePanelReorder';
import { FIELD_PANELS } from '../../appSections';
import styles from './Field.module.scss';

export const FIELD_ORDER_PREF_KEY = 'field-order';

// The full-width panels beneath the notebook (Initiative, Treasure, Journal,
// Chronicle), rearrangeable in a player-chosen order that persists per device.
// Shares the same drag engine and PanelReorderContext as the notebook grid.
const Field = () => {
  const { order, panelsByKey, handles } = usePanelReorder(
    FIELD_PANELS,
    FIELD_ORDER_PREF_KEY
  );

  return (
    <PanelReorderContext.Provider value={handles}>
      <div className={styles.field}>
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

export default Field;
