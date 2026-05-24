import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NPCs from './NPCs';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('NPCs', () => {
  it('records, edits, and removes a person', async () => {
    const user = userEvent.setup();
    render(<NPCs />);

    expect(screen.getByText(/No one yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('New person'), 'Sir Talbot{Enter}');
    expect(screen.getByText('Sir Talbot')).toBeInTheDocument();
    expect(screen.getByText('1 name in the ledger')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Edit Sir Talbot/ }));
    await user.type(screen.getByLabelText('Location'), 'The Wounded Boar');
    await user.type(screen.getByLabelText('Person notes'), 'Owes the party a favour');
    await user.click(screen.getByRole('button', { name: 'Ally' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('The Wounded Boar')).toBeInTheDocument();
    expect(screen.getByText('Owes the party a favour')).toBeInTheDocument();
    // Role badge reflects ally
    expect(
      screen.getByRole('button', { name: /Sir Talbot — role ally/ })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Remove Sir Talbot/ }));
    expect(screen.queryByText('Sir Talbot')).not.toBeInTheDocument();
  });

  it('cycles a role with the inline badge', async () => {
    const user = userEvent.setup();
    render(<NPCs />);

    await user.type(screen.getByLabelText('New person'), 'Hooded stranger{Enter}');

    const badge = screen.getByRole('button', {
      name: /Hooded stranger — role unknown/,
    });
    await user.click(badge);
    expect(
      screen.getByRole('button', { name: /Hooded stranger — role ally/ })
    ).toBeInTheDocument();
  });

  it('filters by role and shows counts', async () => {
    const user = userEvent.setup();
    render(<NPCs />);

    await user.type(screen.getByLabelText('New person'), 'Ada{Enter}');
    await user.type(screen.getByLabelText('New person'), 'Borg{Enter}');

    // Promote Ada to Ally by cycling once
    await user.click(screen.getByRole('button', { name: /Ada — role unknown/ }));

    await user.click(screen.getByRole('button', { name: /^Ally/ }));
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.queryByText('Borg')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Unknown/ }));
    expect(screen.getByText('Borg')).toBeInTheDocument();
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();
  });
});
