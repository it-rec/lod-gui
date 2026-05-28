import { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import Button from '../common/Button/Button';
import { getSocket, getClientId } from '../../socket/socket';
import { prefGet, prefSet } from '../../utils/localStorageUtil';
import { createSoundscapePlayer, SCENES } from '../../utils/soundscape';
import styles from './Soundscape.module.scss';

const VOLUME_PREF = 'soundscape-volume';
const MUTE_PREF = 'soundscape-muted';

// Inline "wave" icon — no need to add a new entry to the shared icon set.
const IconWave = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" />
    <path d="M3 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" opacity="0.55" />
  </svg>
);

const loadVolume = () => {
  const v = prefGet(VOLUME_PREF);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.4;
};
const loadMuted = () => {
  const m = prefGet(MUTE_PREF);
  return typeof m === 'boolean' ? m : false;
};

// Header-mounted ambience picker. Each device runs its own synth player
// (Web Audio, no asset files); selecting a scene emits `soundscape:set`
// over Socket.IO so the rest of the table follows. Volume and mute are
// per-device — every player sets their own.
const Soundscape = () => {
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState('silence');
  const [volume, setVolumeState] = useState(loadVolume);
  const [muted, setMuted] = useState(loadMuted);
  const playerRef = useRef(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Lazily create the player on first interaction — browsers block audio
  // contexts that get instantiated without a user gesture, so we wait.
  const ensurePlayer = () => {
    if (!playerRef.current) {
      playerRef.current = createSoundscapePlayer();
      playerRef.current.setVolume(muted ? 0 : volume);
    }
    return playerRef.current;
  };

  const applyScene = useCallback(
    (next) => {
      setScene(next);
      const player = playerRef.current;
      if (!player) return;
      player.setScene(next);
    },
    []
  );

  // Listen for peers picking a scene.
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload) => {
      if (!payload || typeof payload.scene !== 'string') return;
      if (payload.origin && payload.origin === getClientId()) return;
      applyScene(payload.scene);
    };
    socket.on('soundscape:set', handler);
    return () => socket.off('soundscape:set', handler);
  }, [applyScene]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pickScene = (id) => {
    ensurePlayer();
    applyScene(id);
    getSocket().emit('soundscape:set', { scene: id });
  };

  const changeVolume = (next) => {
    setVolumeState(next);
    prefSet(VOLUME_PREF, next);
    if (playerRef.current) playerRef.current.setVolume(muted ? 0 : next);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    prefSet(MUTE_PREF, next);
    if (playerRef.current) playerRef.current.setVolume(next ? 0 : volume);
  };

  // Stop the synth on unmount so a navigation away doesn't leave the
  // audio thread looping.
  useEffect(
    () => () => {
      if (playerRef.current) playerRef.current.stop();
    },
    []
  );

  const playing = scene !== 'silence' && !muted;

  return (
    <div className={styles.wrapper}>
      <Button
        ref={triggerRef}
        kind="ghost"
        size="sm"
        iconOnly
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Ambient soundscape"
        title="Ambience"
        onClick={() => setOpen((v) => !v)}
        className={cx(styles.trigger, { [styles.triggerPlaying]: playing })}
      >
        <IconWave />
      </Button>
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Ambient soundscape"
          className={styles.popover}
        >
          <header className={styles.head}>
            <h2 className={styles.title}>Ambience</h2>
            <p className={styles.subtitle}>
              Synth-only — picking a scene plays it for every connected player.
            </p>
          </header>

          <ul className={styles.scenes} role="radiogroup" aria-label="Scene">
            {SCENES.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={scene === s.id}
                  className={cx(styles.scene, { [styles.sceneActive]: scene === s.id })}
                  onClick={() => pickScene(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.volumeRow}>
            <button
              type="button"
              className={styles.muteButton}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={muted}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(event) => changeVolume(Number(event.target.value) / 100)}
              aria-label="Soundscape volume"
              className={styles.volume}
            />
            <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
          </div>

          <p className={styles.note}>
            Volume and mute are saved per device. Scene changes broadcast
            instantly to every connected player.
          </p>
        </div>
      )}
    </div>
  );
};

export default Soundscape;
