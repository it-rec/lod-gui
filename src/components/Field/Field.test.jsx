import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Field, { FIELD_ORDER_PREF_KEY } from './Field';
import { reconcilePanelOrder } from '../common/Panel/usePanelReorder';
import { prefSet, prefRemove } from '../../utils/localStorageUtil';

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    id: 'test-socket',
  }),
}));

beforeEach(() => {
  prefRemove(FIELD_ORDER_PREF_KEY);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(null) }))
  );
});

describe('reconcilePanelOrder', () => {
  it('appends missing keys and drops unknown ones', () => {
    expect(reconcilePanelOrder(['journal', 'bogus'], ['a', 'journal'])).toEqual([
      'journal',
      'a',
    ]);
  });
});

describe('Field', () => {
  it('renders each field panel with a drag handle', async () => {
    render(<Field />);
    expect(
      await screen.findByRole('button', {
        name: 'Reorder Initiative (drag, or press arrow keys)',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Reorder The Chronicle (drag, or press arrow keys)',
      })
    ).toBeInTheDocument();
  });

  it('renders panels in the persisted order', async () => {
    prefSet(FIELD_ORDER_PREF_KEY, [
      'chronicle',
      'journal',
      'inventory',
      'initiative',
    ]);
    render(<Field />);

    await screen.findByRole('button', {
      name: 'Reorder The Chronicle (drag, or press arrow keys)',
    });
    const handles = screen
      .getAllByRole('button', { name: /Reorder/ })
      .map((node) => node.getAttribute('aria-label'));
    expect(handles).toEqual([
      'Reorder The Chronicle (drag, or press arrow keys)',
      'Reorder Journal (drag, or press arrow keys)',
      'Reorder Treasure (drag, or press arrow keys)',
      'Reorder Initiative (drag, or press arrow keys)',
    ]);
  });
});
