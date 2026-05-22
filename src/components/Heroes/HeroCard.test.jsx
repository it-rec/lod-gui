import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeroCard from './HeroCard';
import { createHero } from '../character';

// A stateful wrapper so multi-step edits flow back into the card.
const Harness = ({ hero, onRemove = () => {}, canRemove = true }) => {
  const [state, setState] = useState(hero);
  return (
    <HeroCard
      hero={state}
      onChange={setState}
      onRemove={onRemove}
      canRemove={canRemove}
    />
  );
};

describe('HeroCard', () => {
  it('expands to reveal the character sheet', async () => {
    const user = userEvent.setup();
    render(<Harness hero={createHero({ name: 'Aria' })} />);

    expect(screen.queryByText('Skills')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open character sheet' }));

    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Traits')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('adds a skill and sets its rank', async () => {
    const user = userEvent.setup();
    render(<Harness hero={createHero({ name: 'Aria' })} />);

    await user.click(screen.getByRole('button', { name: 'Open character sheet' }));
    await user.type(screen.getByLabelText('New skill'), 'Lore{Enter}');
    expect(screen.getByText('Lore')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set Lore rank to 4' }));
    const dots = screen.getAllByRole('button', { name: /Set Lore rank to/ });
    expect(
      dots.filter((dot) => dot.getAttribute('aria-pressed') === 'true')
    ).toHaveLength(4);
  });

  it('shows an added condition on the collapsed card', async () => {
    const user = userEvent.setup();
    render(<Harness hero={createHero({ name: 'Aria' })} />);

    await user.click(screen.getByRole('button', { name: 'Open character sheet' }));
    await user.type(screen.getByLabelText('New condition'), 'Poisoned{Enter}');
    await user.click(screen.getByRole('button', { name: 'Hide character sheet' }));

    expect(screen.getByText('Poisoned')).toBeInTheDocument();
  });

  it('disables removal when it is the last hero', async () => {
    const user = userEvent.setup();
    render(<Harness hero={createHero({ name: 'Solo' })} canRemove={false} />);

    await user.click(screen.getByRole('button', { name: 'Open character sheet' }));
    expect(screen.getByRole('button', { name: 'Remove hero' })).toBeDisabled();
  });

  it('calls onRemove when the hero is removed', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Harness hero={createHero({ name: 'Aria' })} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Open character sheet' }));
    await user.click(screen.getByRole('button', { name: 'Remove hero' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
