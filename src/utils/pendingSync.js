import { post } from './networkUtils';
import { subscribeConnectionStatus, getConnectionStatus } from '../socket/socket';

// Tracks channels whose latest edit has not yet reached the server — the edits
// a player makes while the realtime link is down. A small pub/sub store (not
// React context) so the data hook can report into it without prop drilling.
//
// When the connection returns, every still-dirty channel is re-posted once, so
// offline edits sync themselves instead of waiting for the next manual change.

let pending = new Map(); // channel -> { path, payload }
const listeners = new Set();
let retryWired = false;

const emit = () => listeners.forEach((listener) => listener(pending.size));

const flush = () => {
  for (const [channel, { path, payload }] of [...pending]) {
    post(path, payload)
      .then(() => markClean(channel))
      .catch(() => {
        /* still unreachable — keep it dirty for the next reconnect */
      });
  }
};

// Lazily watch the connection so importing this module has no side effects
// (and tests can drive it explicitly). Re-flush on each rising edge to
// 'connected'.
const wireRetry = () => {
  if (retryWired) return;
  retryWired = true;
  let previous = getConnectionStatus();
  subscribeConnectionStatus((status) => {
    const was = previous;
    previous = status;
    if (status === 'connected' && was !== 'connected') flush();
  });
};

export const markDirty = (channel, path, payload) => {
  wireRetry();
  pending.set(channel, { path, payload });
  emit();
};

export const markClean = (channel) => {
  if (pending.delete(channel)) emit();
};

export const getPendingCount = () => pending.size;

export const subscribePending = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Test-only: drop all state so specs don't bleed into one another.
export const __resetPending = () => {
  pending = new Map();
  retryWired = false;
  emit();
};
