import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Keep the smoke test offline: stub the realtime socket and the data fetch.
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
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(null) })
    )
  );
});

describe('App', () => {
  it('renders the header and every campaign panel', async () => {
    render(<App />);

    expect(await screen.findByText('LoD')).toBeInTheDocument();
    expect(screen.getByText('The Party')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Fame')).toBeInTheDocument();
    expect(screen.getByText('The Calendar')).toBeInTheDocument();
    expect(screen.getByText('Keywords')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('The Chronicle')).toBeInTheDocument();
  });

  it('seeds a default party of hero cards', async () => {
    render(<App />);

    const nameFields = await screen.findAllByLabelText('Hero name');
    expect(nameFields.length).toBeGreaterThanOrEqual(4);
  });

  it('marks a chronicle entry as recorded when its tile is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const tile = await screen.findByLabelText('Entry A1');
    expect(tile).toHaveAttribute('aria-pressed', 'false');

    await user.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
  });
});
