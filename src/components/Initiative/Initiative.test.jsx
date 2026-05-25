import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Initiative from './Initiative';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

beforeEach(() => {
  // The Initiative panel ships defaultCollapsed=true; clear the preference
  // so each test starts in the same state.
  window.localStorage.clear();
  // Stable rolls so we can predict the d20 fallback.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const expandPanel = async (user) => {
  // Initiative panel is collapsed by default.
  await user.click(screen.getByRole('button', { name: /Show Initiative/ }));
};

describe('Initiative', () => {
  it('renders the empty state until a combatant is added', async () => {
    const user = userEvent.setup();
    render(<Initiative />);
    await expandPanel(user);
    expect(screen.getByText(/Roll for initiative/)).toBeInTheDocument();
    expect(screen.getByText(/No combatants/)).toBeInTheDocument();
  });

  it('adds combatants and orders them by initiative descending', async () => {
    const user = userEvent.setup();
    render(<Initiative />);
    await expandPanel(user);

    await user.type(screen.getByLabelText('New combatant name'), 'Goblin');
    await user.type(screen.getByLabelText('Initiative roll'), '8');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.type(screen.getByLabelText('New combatant name'), 'Rogue');
    await user.type(screen.getByLabelText('Initiative roll'), '17');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('Rogue')).toBeInTheDocument();
    expect(within(items[1]).getByText('Goblin')).toBeInTheDocument();
  });

  it('cycles the current turn and increments the round at the loop', async () => {
    const user = userEvent.setup();
    render(<Initiative />);
    await expandPanel(user);

    // Two combatants.
    for (const [name, init] of [
      ['First', '20'],
      ['Second', '10'],
    ]) {
      await user.type(screen.getByLabelText('New combatant name'), name);
      await user.type(screen.getByLabelText('Initiative roll'), init);
      await user.click(screen.getByRole('button', { name: 'Add' }));
    }

    expect(screen.getByText(/Round 1 · 2 combatants/)).toBeInTheDocument();

    const findCurrentName = () => {
      const current = screen
        .getAllByRole('listitem')
        .find((node) => node.getAttribute('aria-current') === 'true');
      return current?.textContent || '';
    };

    await user.click(screen.getByRole('button', { name: /Begin!/ }));
    expect(findCurrentName()).toContain('First');

    await user.click(screen.getByRole('button', { name: /Next turn/ }));
    expect(findCurrentName()).toContain('Second');

    await user.click(screen.getByRole('button', { name: /Next turn/ }));
    expect(screen.getByText(/Round 2/)).toBeInTheDocument();
    expect(findCurrentName()).toContain('First');
  });

  it('tracks HP and conditions per combatant', async () => {
    const user = userEvent.setup();
    render(<Initiative />);
    await expandPanel(user);

    await user.type(screen.getByLabelText('New combatant name'), 'Ogre');
    await user.type(screen.getByLabelText('Initiative roll'), '5');
    await user.type(screen.getByLabelText('Hit points'), '14');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('14')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Take 1 damage from Ogre'));
    await user.click(screen.getByLabelText('Take 1 damage from Ogre'));
    expect(screen.getByText('12')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Add condition to Ogre'), 'prone{Enter}');
    expect(screen.getByRole('button', { name: /Remove condition prone/ })).toBeInTheDocument();
  });

  it('ends the encounter and clears state', async () => {
    const user = userEvent.setup();
    render(<Initiative />);
    await expandPanel(user);
    await user.type(screen.getByLabelText('New combatant name'), 'Wolf');
    await user.type(screen.getByLabelText('Initiative roll'), '11');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.click(screen.getByRole('button', { name: /End encounter/ }));
    expect(screen.queryByText('Wolf')).not.toBeInTheDocument();
    expect(screen.getByText(/No combatants/)).toBeInTheDocument();
  });
});
