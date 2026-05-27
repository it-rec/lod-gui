import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestGraph from './QuestGraph';

const QUESTS = [
  { id: 'q-find',   title: 'Find the heir',         isDone: false, dependsOn: [], notes: 'Start in Greycross.' },
  { id: 'q-fight',  title: 'Calm the orchard',      isDone: true,  dependsOn: [], notes: '' },
  { id: 'q-seal',   title: 'Recover the seal',      isDone: false, dependsOn: ['q-find'], notes: 'Inside the manor.' },
  { id: 'q-coron',  title: 'Coronation at Bronze',  isDone: false, dependsOn: ['q-seal', 'q-fight'], notes: '' },
];

describe('QuestGraph', () => {
  it('renders an empty hint when there are no quests', () => {
    render(<QuestGraph quests={[]} />);
    expect(screen.getByText(/No quests yet/)).toBeInTheDocument();
  });

  it('renders one node per quest', () => {
    render(<QuestGraph quests={QUESTS} />);
    for (const q of QUESTS) {
      expect(screen.getByTestId(`graph-node-${q.id}`)).toBeInTheDocument();
    }
  });

  it('flags completed quests on the node label', () => {
    render(<QuestGraph quests={QUESTS} />);
    expect(
      screen.getByRole('button', { name: 'Calm the orchard (completed)' })
    ).toBeInTheDocument();
  });

  it('flags locked quests (open prereq) on the node label', () => {
    render(<QuestGraph quests={QUESTS} />);
    // Coronation depends on q-seal (open) → it's locked.
    expect(
      screen.getByRole('button', { name: 'Coronation at Bronze (locked)' })
    ).toBeInTheDocument();
  });

  it('clicking a node opens its detail panel and reports focus outward', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();
    render(<QuestGraph quests={QUESTS} onFocusQuest={onFocus} />);

    await user.click(screen.getByTestId('graph-node-q-seal'));

    expect(onFocus).toHaveBeenCalledWith('q-seal');
    const dialog = screen.getByRole('dialog', { name: /Recover the seal details/ });
    expect(dialog).toHaveTextContent('Recover the seal');
    expect(dialog).toHaveTextContent('Inside the manor.');
  });
});
