import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast, getToasts, dismissToast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getToasts()
      .slice()
      .forEach((entry) => dismissToast(entry.id));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pushes a toast and dismisses it', () => {
    toast.success('Saved');
    expect(getToasts()).toHaveLength(1);

    dismissToast(getToasts()[0].id);
    expect(getToasts()).toHaveLength(0);
  });

  it('deduplicates toasts that share an id', () => {
    toast.error('First', 'a', 'connection');
    toast.error('Second', 'b', 'connection');

    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0].title).toBe('Second');
  });

  it('auto-dismisses a toast after the timeout', () => {
    toast.info('Heads up');
    expect(getToasts()).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(getToasts()).toHaveLength(0);
  });
});
