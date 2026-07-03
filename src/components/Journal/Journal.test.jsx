import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Journal from './Journal';
import { getToasts } from '../common/Toast/toastStore';

// The journal hook also subscribes to the calendar; both go through the same
// mock so we can drive a fixed "today" into the component.
vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ channel, initial }) => {
      const [value, setValue] = useState(
        channel === 'calendar' ? { day: 3, time: 'afternoon' } : initial
      );
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Journal', () => {
  it('records an entry stamped with the current calendar day and phase', async () => {
    const user = userEvent.setup();
    render(<Journal />);

    expect(screen.getByText(/No entries yet/)).toBeInTheDocument();
    expect(screen.getByText(/Day 3.*Afternoon/)).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('New journal entry'),
      'We crossed the river at dusk.'
    );
    await user.click(screen.getByRole('button', { name: /Record/ }));

    expect(
      screen.getByText('We crossed the river at dusk.')
    ).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    // Stamp on the recorded entry shows the phase.
    expect(screen.getAllByText('Afternoon').length).toBeGreaterThanOrEqual(1);
  });

  it('edits and removes an entry', async () => {
    const user = userEvent.setup();
    render(<Journal />);
    await user.type(screen.getByLabelText('New journal entry'), 'first take');
    await user.click(screen.getByRole('button', { name: /Record/ }));

    await user.click(screen.getByLabelText('Edit journal entry'));
    const editor = screen.getByLabelText('Edit journal entry');
    await user.clear(editor);
    await user.type(editor, 'corrected take');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('corrected take')).toBeInTheDocument();
    expect(screen.queryByText('first take')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove journal entry'));
    expect(screen.queryByText('corrected take')).not.toBeInTheDocument();
  });

  it('raises an undo toast on remove that restores the entry', async () => {
    const user = userEvent.setup();
    render(<Journal />);
    await user.type(screen.getByLabelText('New journal entry'), 'lost words');
    await user.click(screen.getByRole('button', { name: /Record/ }));

    await user.click(screen.getByLabelText('Remove journal entry'));
    expect(screen.queryByText('lost words')).not.toBeInTheDocument();

    const toastItem = getToasts().at(-1);
    expect(toastItem.title).toBe('Journal entry removed');
    act(() => toastItem.action.onClick());
    expect(screen.getByText('lost words')).toBeInTheDocument();
  });

  it('reveals search once enough entries exist and filters by text', async () => {
    const user = userEvent.setup();
    render(<Journal />);

    const compose = screen.getByLabelText('New journal entry');
    expect(screen.queryByLabelText('Search journal entries')).not.toBeInTheDocument();
    for (const text of [
      'Met the baker',
      'Fought wolves at the ford',
      'Bought supplies',
      'Slept at the inn',
    ]) {
      await user.type(compose, text);
      await user.click(screen.getByRole('button', { name: /Record/ }));
    }

    const search = screen.getByLabelText('Search journal entries');
    await user.type(search, 'wolves');
    expect(screen.getByText('Fought wolves at the ford')).toBeInTheDocument();
    expect(screen.queryByText('Met the baker')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'gryphon');
    expect(screen.getByText(/No entries match/)).toBeInTheDocument();

    await user.clear(search);
    expect(screen.getByText('Met the baker')).toBeInTheDocument();
  });

  it('renders Markdown in saved entries', async () => {
    const user = userEvent.setup();
    render(<Journal />);
    await user.type(
      screen.getByLabelText('New journal entry'),
      'We met **Lord Vrass** at *dusk*.'
    );
    await user.click(screen.getByRole('button', { name: /Record/ }));

    expect(screen.getByText('Lord Vrass').tagName).toBe('STRONG');
    expect(screen.getByText('dusk').tagName).toBe('EM');
  });
});
