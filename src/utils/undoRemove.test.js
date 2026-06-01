import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeWithUndo } from './undoRemove';
import { getToasts, subscribeToasts } from '../components/common/Toast/toastStore';

// Drain any toasts left by other specs between runs.
const clearToasts = () => {
  getToasts()
    .slice()
    .forEach((t) => clearTimeout(t.timer));
};

describe('removeWithUndo', () => {
  beforeEach(() => {
    clearToasts();
  });

  it('saves the list without the removed item', () => {
    const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const save = vi.fn();
    removeWithUndo({ list, id: 'b', save, label: 'Bee', noun: 'Person' });
    expect(save).toHaveBeenCalledWith([{ id: 'a' }, { id: 'c' }]);
  });

  it('raises an actionable toast whose Undo restores the exact previous list', () => {
    const list = [{ id: 'a' }, { id: 'b' }];
    const save = vi.fn();
    removeWithUndo({ list, id: 'a', save, label: 'Aye', noun: 'Quest' });

    const toastItem = getToasts().at(-1);
    expect(toastItem.title).toBe('Quest removed');
    expect(toastItem.action.label).toBe('Undo');

    save.mockClear();
    toastItem.action.onClick();
    expect(save).toHaveBeenCalledWith(list);
  });

  it('notifies subscribers so the Toaster repaints', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    removeWithUndo({ list: [{ id: 'x' }], id: 'x', save: vi.fn(), noun: 'Item' });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
