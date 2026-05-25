import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import { IconClock } from '../common/icons';
import { prefGet, prefSet, prefRemove } from '../../utils/localStorageUtil';
import styles from './SessionTimer.module.scss';

const STORE_KEY = 'session-timer';

// Persisted shape:
//   { startedAt: number(ms), elapsedBefore: number(ms), running: boolean }
// `elapsedBefore` is the accumulated runtime before the current "run" began;
// total elapsed = elapsedBefore + (running ? now - startedAt : 0).

const readState = () => {
  const raw = prefGet(STORE_KEY);
  if (!raw || typeof raw !== 'object') {
    return { startedAt: 0, elapsedBefore: 0, running: false };
  }
  return {
    startedAt: Number.isFinite(raw.startedAt) ? raw.startedAt : 0,
    elapsedBefore: Number.isFinite(raw.elapsedBefore) ? raw.elapsedBefore : 0,
    running: Boolean(raw.running),
  };
};

const writeState = (state) => prefSet(STORE_KEY, state);

const computeElapsed = (state, now) => {
  if (state.running) return state.elapsedBefore + (now - state.startedAt);
  return state.elapsedBefore;
};

const formatElapsed = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const SessionTimer = () => {
  const [state, setState] = useState(readState);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const popoverRef = useRef(null);

  // Tick once a second while running. Pause the interval when the timer is
  // paused to avoid pointless re-renders.
  useEffect(() => {
    if (!state.running) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.running]);

  // Close the popover on click outside / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
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

  const elapsed = computeElapsed(state, now);

  const toggle = useCallback(() => {
    setState((current) => {
      const tick = Date.now();
      if (current.running) {
        const next = {
          startedAt: 0,
          elapsedBefore: current.elapsedBefore + (tick - current.startedAt),
          running: false,
        };
        writeState(next);
        return next;
      }
      const next = {
        startedAt: tick,
        elapsedBefore: current.elapsedBefore,
        running: true,
      };
      writeState(next);
      return next;
    });
    setNow(Date.now());
  }, []);

  const reset = useCallback(() => {
    const next = { startedAt: 0, elapsedBefore: 0, running: false };
    setState(next);
    prefRemove(STORE_KEY);
    setNow(Date.now());
  }, []);

  // Header label: short version (mm:ss) plus a play/pause hint dot.
  const label = formatElapsed(elapsed);

  return (
    <div className={styles.wrapper} ref={popoverRef}>
      <Button
        kind="ghost"
        size="sm"
        aria-label={`Session timer ${state.running ? 'running' : 'paused'} at ${label}`}
        onClick={() => setOpen((value) => !value)}
        className={styles.trigger}
      >
        <IconClock className={state.running ? styles.iconRunning : undefined} />
        <span className={styles.label}>{label}</span>
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Session timer"
          className={styles.popover}
        >
          <p className={styles.heading}>Session timer</p>
          <p className={styles.display}>{formatElapsed(elapsed)}</p>
          <p className={styles.state}>
            {state.running ? 'Running' : elapsed > 0 ? 'Paused' : 'Not started'}
          </p>
          <div className={styles.controls}>
            <Button kind="gold" size="sm" onClick={toggle}>
              {state.running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
            </Button>
            <Button kind="ghost" size="sm" onClick={reset} disabled={elapsed === 0}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTimer;
