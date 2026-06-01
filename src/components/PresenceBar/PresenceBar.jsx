import { useEffect } from 'react';
import { usePresenceRoster } from '../../hooks/useConnection';
import { usePlayerName } from '../../hooks/usePlayerName';
import { identifyPlayer } from '../../socket/socket';
import styles from './PresenceBar.module.scss';

const MAX_SHOWN = 5;

// Up to two initials from a name: "Mara Quill" -> "MQ", "gandalf" -> "GA".
export const initialsOf = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// A stable hue per name so each player keeps the same avatar colour.
export const hueOf = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
};

// A row of initial-avatars showing who is at the table right now. Reads the
// room roster pushed over Socket.IO and keeps the server informed of this
// tab's own name. Renders nothing until at least one player has a name.
const PresenceBar = () => {
  const { name } = usePlayerName();
  const roster = usePresenceRoster();

  // Mirror our name to the server whenever it changes (and on first mount);
  // reconnects re-announce automatically from the socket layer.
  useEffect(() => {
    identifyPlayer(name);
  }, [name]);

  const named = roster.filter((player) => player.name);
  if (named.length === 0) return null;

  const shown = named.slice(0, MAX_SHOWN);
  const extra = named.length - shown.length;
  const label = `${named.length} ${named.length === 1 ? 'player' : 'players'} at the table: ${named
    .map((player) => player.name)
    .join(', ')}`;

  return (
    <div className={styles.bar} role="group" aria-label={label}>
      {shown.map((player) => (
        <span
          key={player.id}
          className={styles.avatar}
          style={{ '--avatar-hue': hueOf(player.name) }}
          title={player.name}
          aria-hidden="true"
        >
          {initialsOf(player.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className={styles.more} aria-hidden="true">
          +{extra}
        </span>
      )}
    </div>
  );
};

export default PresenceBar;
