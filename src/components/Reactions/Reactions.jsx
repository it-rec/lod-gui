import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, getClientId } from '../../socket/socket';
import styles from './Reactions.module.scss';

// Quick table-side reactions the whole party sees. Six buttons, one
// fly-up animation, no persistence — the server just relays the event.
export const REACTIONS = [
  { id: 'clap',  emoji: '👏', label: 'Applause' },
  { id: 'crit',  emoji: '🎯', label: 'Critical hit' },
  { id: 'fear',  emoji: '😱', label: 'Oh no' },
  { id: 'sword', emoji: '⚔️', label: 'Battle' },
  { id: 'skull', emoji: '💀', label: 'Down they go' },
  { id: 'cheer', emoji: '🍻', label: 'Cheers' },
];

const FLY_MS = 2400;
const MAX_ACTIVE = 24;

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `react-${Math.random().toString(36).slice(2, 10)}`;

const Reactions = () => {
  const [active, setActive] = useState([]);
  // Refs so handlers always see the freshest list without re-binding.
  const activeRef = useRef(active);
  activeRef.current = active;

  const spawn = useCallback((emoji, { own }) => {
    const entry = {
      id: newId(),
      emoji,
      own,
      // Stagger horizontal position so a flurry of identical reactions
      // doesn't stack into a single column.
      offset: Math.random() * 80 - 40,
      drift: Math.random() * 30 - 15,
    };
    const next = [entry, ...activeRef.current].slice(0, MAX_ACTIVE);
    setActive(next);
    window.setTimeout(() => {
      setActive((current) => current.filter((e) => e.id !== entry.id));
    }, FLY_MS);
  }, []);

  // Listen for reactions from other clients (and our own echo, which we
  // skip — the click handler already spawned a local one).
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload) => {
      if (!payload || typeof payload.emoji !== 'string') return;
      if (payload.origin && payload.origin === getClientId()) return;
      spawn(payload.emoji, { own: false });
    };
    socket.on('reaction:send', handler);
    return () => socket.off('reaction:send', handler);
  }, [spawn]);

  const send = useCallback(
    (emoji) => {
      spawn(emoji, { own: true });
      const socket = getSocket();
      socket.emit('reaction:send', { emoji });
    },
    [spawn]
  );

  return (
    <>
      <div className={styles.field} aria-hidden="true" data-testid="reaction-field">
        {active.map((entry) => (
          <span
            key={entry.id}
            className={styles.flyer}
            data-testid="reaction-flyer"
            style={{
              left: `calc(50% + ${entry.offset}px)`,
              '--drift': `${entry.drift}px`,
            }}
          >
            {entry.emoji}
          </span>
        ))}
      </div>
      <div className={styles.picker} role="group" aria-label="Table reactions">
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={styles.button}
            aria-label={r.label}
            title={r.label}
            onClick={() => send(r.emoji)}
          >
            <span aria-hidden="true">{r.emoji}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Reactions;
