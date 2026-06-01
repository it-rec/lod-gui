import { useConnection, usePresence } from '../../../hooks/useConnection';
import { usePendingCount } from '../../../hooks/usePendingSync';
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
  const pending = usePendingCount();
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
      {pending > 0 && (
        <span
          className={styles.pending}
          title={`${pending} ${pending === 1 ? 'change is' : 'changes are'} waiting to sync`}
          aria-label={`${pending} unsynced ${pending === 1 ? 'change' : 'changes'}`}
        >
          <span className={styles.pendingGlyph} aria-hidden="true">
            ⟳
          </span>
          {pending}
        </span>
      )}
    </div>
  );
};

export default ConnectionBadge;
