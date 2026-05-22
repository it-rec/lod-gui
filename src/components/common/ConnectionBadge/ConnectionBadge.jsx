import { useConnection } from '../../../hooks/useConnection';
import styles from './ConnectionBadge.module.scss';

const LABELS = {
  connecting: 'Connecting',
  connected: 'Live sync',
  disconnected: 'Offline',
};

const TITLES = {
  connecting: 'Reaching the realtime link…',
  connected: 'Connected — changes sync instantly across players.',
  disconnected: 'No realtime link — edits are kept locally until it returns.',
};

// Small header pill reflecting the live Socket.IO connection status.
const ConnectionBadge = () => {
  const status = useConnection();
  return (
    <div className={`${styles.badge} ${styles[status]}`} title={TITLES[status]}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{LABELS[status]}</span>
    </div>
  );
};

export default ConnectionBadge;
