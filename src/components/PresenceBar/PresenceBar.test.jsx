import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PresenceBar, { initialsOf, hueOf } from './PresenceBar';

let mockRoster = [];
const identifyPlayer = vi.fn();

vi.mock('../../hooks/useConnection', () => ({
  usePresenceRoster: () => mockRoster,
}));
vi.mock('../../hooks/usePlayerName', () => ({
  usePlayerName: () => ({ name: 'Mara Quill' }),
}));
vi.mock('../../socket/socket', () => ({
  identifyPlayer: (...args) => identifyPlayer(...args),
}));

beforeEach(() => {
  mockRoster = [];
  identifyPlayer.mockClear();
});
afterEach(cleanup);

describe('initialsOf', () => {
  it('takes the first and last initials of a multi-word name', () => {
    expect(initialsOf('Mara Quill')).toBe('MQ');
  });
  it('takes the first two letters of a single word', () => {
    expect(initialsOf('gandalf')).toBe('GA');
  });
  it('falls back for an empty name', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('hueOf', () => {
  it('is stable for the same name and within 0–359', () => {
    const h = hueOf('Mara');
    expect(h).toBe(hueOf('Mara'));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
});

describe('PresenceBar', () => {
  it('renders nothing when no one has a name', () => {
    mockRoster = [{ id: 'a', name: '' }];
    const { container } = render(<PresenceBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an avatar per named player and overflows past five', () => {
    mockRoster = [
      { id: '1', name: 'Mara Quill' },
      { id: '2', name: 'Bram' },
      { id: '3', name: 'Cora' },
      { id: '4', name: 'Dov' },
      { id: '5', name: 'Eli' },
      { id: '6', name: 'Fen' },
      { id: '7', name: 'Gwen' },
    ];
    render(<PresenceBar />);
    expect(screen.getByTitle('Mara Quill')).toHaveTextContent('MQ');
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /7 players at the table/ })
    ).toBeInTheDocument();
  });

  it('announces this tab’s name to the server', () => {
    render(<PresenceBar />);
    expect(identifyPlayer).toHaveBeenCalledWith('Mara Quill');
  });
});
