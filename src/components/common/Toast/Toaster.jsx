import { useSyncExternalStore } from 'react';
import styles from './Toaster.module.scss';
import { subscribeToasts, getToasts, dismissToast } from './toastStore';

const GLYPHS = {
  success: '✔',
  error: '✕',
  info: '❖',
};

const Toaster = () => {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`${styles.toast} ${styles[toastItem.kind] || ''}`}
        >
          <span className={styles.glyph}>{GLYPHS[toastItem.kind]}</span>
          <div className={styles.body}>
            <div className={styles.title}>{toastItem.title}</div>
            {toastItem.message && (
              <div className={styles.message}>{toastItem.message}</div>
            )}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismissToast(toastItem.id)}
            aria-label="Dismiss notification"
          >
            {'✕'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
