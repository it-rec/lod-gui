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

  it('renders nodes only for completed or unlocked quests', () => {
    render(<QuestGraph quests={QUESTS} />);
    // Done root is shown.
    expect(screen.getByTestId('graph-node-q-fight')).toBeInTheDocument();
    // Open root is shown.
    expect(screen.getByTestId('graph-node-q-find')).toBeInTheDocument();
    // Recover the seal depends on the still-open "Find the heir" → hidden.
    expect(screen.queryByTestId('graph-node-q-seal')).toBeNull();
    // Coronation depends on the hidden seal quest → also hidden.
    expect(screen.queryByTestId('graph-node-q-coron')).toBeNull();
  });

  it('reveals a quest the moment its prerequisite is marked done', () => {
    const { rerender } = render(<QuestGraph quests={QUESTS} />);
    expect(screen.queryByTestId('graph-node-q-seal')).toBeNull();

    const unlocked = QUESTS.map((q) =>
      q.id === 'q-find' ? { ...q, isDone: true } : q
    );
    rerender(<QuestGraph quests={unlocked} />);

    expect(screen.getByTestId('graph-node-q-seal')).toBeInTheDocument();
  });

  it('flags completed quests on the node label', () => {
    render(<QuestGraph quests={QUESTS} />);
    expect(
      screen.getByRole('button', { name: 'Calm the orchard (completed)' })
    ).toBeInTheDocument();
  });

  it('clicking a node opens its detail panel and reports focus outward', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();
    render(<QuestGraph quests={QUESTS} onFocusQuest={onFocus} />);

    await user.click(screen.getByTestId('graph-node-q-find'));

    expect(onFocus).toHaveBeenCalledWith('q-find');
    const dialog = screen.getByRole('dialog', { name: /Find the heir details/ });
    expect(dialog).toHaveTextContent('Find the heir');
    expect(dialog).toHaveTextContent('Start in Greycross.');
    expect(dialog).toHaveTextContent('Active');
  });
});
