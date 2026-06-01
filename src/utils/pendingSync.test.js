import { describe, it, expect, vi, beforeEach } from 'vitest';

let statusListener;
let currentStatus = 'disconnected';
const post = vi.fn(() => Promise.resolve());

vi.mock('../socket/socket', () => ({
  subscribeConnectionStatus: (listener) => {
    statusListener = listener;
    return () => {};
  },
  getConnectionStatus: () => currentStatus,
}));
vi.mock('./networkUtils', () => ({
  post: (...args) => post(...args),
}));

import {
  markDirty,
  markClean,
  getPendingCount,
  subscribePending,
  __resetPending,
} from './pendingSync';

beforeEach(() => {
  __resetPending();
  post.mockClear();
  post.mockResolvedValue(undefined);
  currentStatus = 'disconnected';
  statusListener = undefined;
});

describe('pendingSync', () => {
  it('counts dirty channels and dedupes by channel', () => {
    markDirty('gold', '/api/gold', { gold: 1 });
    markDirty('gold', '/api/gold', { gold: 2 });
    markDirty('fame', '/api/fame', { fame: 1 });
    expect(getPendingCount()).toBe(2);
  });

  it('clears a channel once it syncs', () => {
    markDirty('gold', '/api/gold', { gold: 1 });
    markClean('gold');
    expect(getPendingCount()).toBe(0);
  });

  it('notifies subscribers of the current count', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePending(listener);
    markDirty('gold', '/api/gold', { gold: 1 });
    expect(listener).toHaveBeenLastCalledWith(1);
    markClean('gold');
    expect(listener).toHaveBeenLastCalledWith(0);
    unsubscribe();
  });

  it('replays dirty channels when the connection returns', async () => {
    markDirty('gold', '/api/gold', { gold: 7 });
    markDirty('fame', '/api/fame', { fame: 3 });
    expect(getPendingCount()).toBe(2);

    // Simulate the link coming back.
    currentStatus = 'connected';
    statusListener('connected');

    // Let the resolved post promises settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledWith('/api/gold', { gold: 7 });
    expect(getPendingCount()).toBe(0);
  });

  it('keeps a channel dirty if the replay post fails', async () => {
    post.mockRejectedValue(new Error('still offline'));
    markDirty('gold', '/api/gold', { gold: 7 });

    currentStatus = 'connected';
    statusListener('connected');
    await Promise.resolve();
    await Promise.resolve();

    expect(getPendingCount()).toBe(1);
  });
});
