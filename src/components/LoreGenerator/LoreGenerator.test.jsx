import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoreGenerator from './LoreGenerator';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const open = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Lore generator' }));
};

describe('LoreGenerator', () => {
  it('opens a popover with three labelled rows', async () => {
    const user = userEvent.setup();
    render(<LoreGenerator />);
    await open(user);

    expect(screen.getByRole('dialog', { name: 'Lore generator' })).toBeInTheDocument();
    expect(screen.getByText('Tavern name')).toBeInTheDocument();
    expect(screen.getByText('NPC')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('rerolls a single generator without touching the others', async () => {
    const user = userEvent.setup();
    render(<LoreGenerator />);
    await open(user);

    const before = screen.getByTestId('lore-result-tavern').textContent;
    const npcBefore = screen.getByTestId('lore-result-npc').textContent;

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const rerollButtons = screen.getAllByRole('button', { name: 'Reroll' });
    await user.click(rerollButtons[0]);

    expect(screen.getByTestId('lore-result-tavern').textContent).not.toBe(before);
    expect(screen.getByTestId('lore-result-npc').textContent).toBe(npcBefore);
  });

  it('rerolls every generator with "Roll all"', async () => {
    const user = userEvent.setup();
    render(<LoreGenerator />);
    await open(user);

    const tavernBefore = screen.getByTestId('lore-result-tavern').textContent;
    const weatherBefore = screen.getByTestId('lore-result-weather').textContent;

    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    await user.click(screen.getByRole('button', { name: 'Roll all' }));

    expect(screen.getByTestId('lore-result-tavern').textContent).not.toBe(tavernBefore);
    expect(screen.getByTestId('lore-result-weather').textContent).not.toBe(weatherBefore);
  });

  it('copies the result and flashes a confirmation', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<LoreGenerator />);
    await open(user);

    const text = screen.getByTestId('lore-result-tavern').textContent;
    await user.click(screen.getByRole('button', { name: 'Copy tavern name' }));

    expect(writeText).toHaveBeenCalledWith(text);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Copy tavern name' })).toHaveTextContent('Copied');
  });

  it('closes the popover when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<LoreGenerator />);
    await open(user);
    expect(screen.getByRole('dialog', { name: 'Lore generator' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Lore generator' })).toBeNull();
  });
});
