import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerBadge from './PlayerBadge';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PlayerBadge', () => {
  it('prompts for a name when none is stored, and saves it', async () => {
    const user = userEvent.setup();
    render(<PlayerBadge />);
    expect(screen.getByText(/Set name/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Set your player name/ }));
    await user.type(screen.getByLabelText('Player name'), 'Sir Talbot');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Sir Talbot')).toBeInTheDocument();
  });

  it('persists the chosen name across remounts', async () => {
    const user = userEvent.setup();
    const view = render(<PlayerBadge />);
    await user.click(screen.getByRole('button', { name: /Set your player name/ }));
    await user.type(screen.getByLabelText('Player name'), 'Brom');
    await user.keyboard('{Enter}');
    expect(screen.getByText('Brom')).toBeInTheDocument();

    view.unmount();
    render(<PlayerBadge />);
    expect(screen.getByText('Brom')).toBeInTheDocument();
  });
});
