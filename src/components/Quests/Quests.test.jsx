import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quests from './Quests';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Quests', () => {
  it('pledges, completes, edits, and removes a quest', async () => {
    const user = userEvent.setup();
    render(<Quests />);

    expect(screen.getByText(/No quests yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('New quest'), 'Find the silver key{Enter}');
    expect(screen.getByText('Find the silver key')).toBeInTheDocument();
    expect(screen.getByText('1 active · 0 completed')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Mark Find the silver key as completed/ })
    );
    expect(screen.getByText('0 active · 1 completed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Edit Find the silver key/ }));
    const notes = screen.getByLabelText('Quest notes');
    await user.type(notes, 'Ask the innkeeper');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Ask the innkeeper')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Remove Find the silver key/ })
    );
    expect(screen.queryByText('Find the silver key')).not.toBeInTheDocument();
    expect(screen.getByText(/No quests yet/)).toBeInTheDocument();
  });

  it('filters between active and completed quests', async () => {
    const user = userEvent.setup();
    render(<Quests />);

    await user.type(screen.getByLabelText('New quest'), 'Slay the wyrm{Enter}');
    await user.type(screen.getByLabelText('New quest'), 'Deliver the letter{Enter}');
    await user.click(
      screen.getByRole('button', { name: /Mark Slay the wyrm as completed/ })
    );

    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.getByText('Deliver the letter')).toBeInTheDocument();
    expect(screen.queryByText('Slay the wyrm')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('Slay the wyrm')).toBeInTheDocument();
    expect(screen.queryByText('Deliver the letter')).not.toBeInTheDocument();
  });
});
