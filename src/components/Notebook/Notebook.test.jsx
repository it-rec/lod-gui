import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Notebook, { reconcileOrder, ORDER_PREF_KEY } from './Notebook';
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
  prefRemove(ORDER_PREF_KEY);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(null) }))
  );
});

describe('reconcileOrder', () => {
  it('returns the full default order when nothing is stored', () => {
    expect(reconcileOrder(undefined)).toEqual([
      'quests',
      'people',
      'locations',
      'keywords',
    ]);
  });

  it('honours a stored order', () => {
    expect(reconcileOrder(['keywords', 'quests', 'people', 'locations'])).toEqual(
      ['keywords', 'quests', 'people', 'locations']
    );
  });

  it('drops unknown keys and appends panels missing from the stored order', () => {
    expect(reconcileOrder(['keywords', 'bogus'])).toEqual([
      'keywords',
      'quests',
      'people',
      'locations',
    ]);
  });
});

describe('Notebook', () => {
  it('renders each notebook panel with a drag handle', async () => {
    render(<Notebook />);
    expect(
      await screen.findByTitle('Drag to reorder Quests')
    ).toBeInTheDocument();
    expect(screen.getByTitle('Drag to reorder People')).toBeInTheDocument();
    expect(screen.getByTitle('Drag to reorder Locations')).toBeInTheDocument();
    expect(screen.getByTitle('Drag to reorder Keywords')).toBeInTheDocument();
  });

  it('renders panels in the persisted order', async () => {
    prefSet(ORDER_PREF_KEY, ['keywords', 'locations', 'people', 'quests']);
    render(<Notebook />);

    await screen.findByTitle('Drag to reorder Keywords');
    const handles = screen
      .getAllByRole('button', { name: /Reorder/ })
      .map((node) => node.getAttribute('aria-label'));
    expect(handles).toEqual([
      'Reorder Keywords (drag, or press arrow keys)',
      'Reorder Locations (drag, or press arrow keys)',
      'Reorder People (drag, or press arrow keys)',
      'Reorder Quests (drag, or press arrow keys)',
    ]);
  });
});
