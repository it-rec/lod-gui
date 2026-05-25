import { useConnection, usePresence } from '../../../hooks/useConnection';
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

// Small header pill reflecting the live Socket.IO connection status. While
// connected, a trailing pill shows how many players are joined to the link.
const ConnectionBadge = () => {
  const status = useConnection();
  const players = usePresence();
  const showPresence = status === 'connected' && players > 0;
  return (
    <div className={`${styles.badge} ${styles[status]}`} title={TITLES[status]}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{LABELS[status]}</span>
      {showPresence && (
        <span
          className={styles.presence}
          aria-label={`${players} ${players === 1 ? 'player' : 'players'} online`}
        >
          {players}
        </span>
      )}
    </div>
  );
};

export default ConnectionBadge;
