import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestLog, { QuestLogButton, openQuestLog } from './QuestLog';

// QuestLog leans on the shared game channel; stub it so the overlay can be
// driven from fixed quest data without a socket or backend.
const channel = vi.hoisted(() => ({ value: [], loading: false }));
vi.mock('../../hooks/useGameChannel', () => ({
  useGameChannel: () => ({
    value: channel.value,
    save: vi.fn(),
    loading: channel.loading,
    error: null,
    reload: vi.fn(),
  }),
}));

const QUESTS = [
  { id: 'a', title: 'Find the lost relic', notes: 'Ask the smith', isDone: false, dependsOn: [] },
  { id: 'b', title: 'Slay the wyrm', notes: '', isDone: false, dependsOn: ['a'] },
  { id: 'c', title: 'Deliver the letter', notes: '', isDone: true, dependsOn: [] },
];

// A scenario where a completed quest cleared a completed prerequisite, so the
// overview has something to attest to.
const COMPLETED_CHAIN = [
  { id: 'a', title: 'Gather the keys', notes: '', isDone: true, dependsOn: [] },
  { id: 'b', title: 'Open the vault', notes: '', isDone: true, dependsOn: ['a'] },
  { id: 'c', title: 'Guard the road', notes: '', isDone: false, dependsOn: [] },
];

beforeEach(() => {
  // scrollIntoView is unimplemented in jsdom; the highlight effect calls it.
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  channel.value = QUESTS;
  channel.loading = false;
});

describe('QuestLog', () => {
  it('opens on Q, groups active and completed quests, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<QuestLog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard('q');

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Quest Log');
    expect(dialog).toHaveTextContent('Find the lost relic');
    expect(dialog).toHaveTextContent('Deliver the letter');
    // Subtitle summary reflects the split.
    expect(dialog).toHaveTextContent('2 active · 1 completed');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks a quest blocked by an unfinished dependency', async () => {
    const user = userEvent.setup();
    render(<QuestLog />);
    await user.keyboard('q');

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Blocked until Find the lost relic'
    );
  });

  it('opens via the programmatic event and the header button', async () => {
    const user = userEvent.setup();
    render(
      <>
        <QuestLogButton />
        <QuestLog />
      </>
    );

    act(() => openQuestLog());
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quest log (Q)' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not open on Q while typing in a text field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="some input" />
        <QuestLog />
      </>
    );

    await user.click(screen.getByLabelText('some input'));
    await user.keyboard('q');

    expect(screen.getByLabelText('some input')).toHaveValue('q');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an empty state when no quests are recorded', async () => {
    channel.value = [];
    const user = userEvent.setup();
    render(<QuestLog />);
    await user.keyboard('q');

    expect(screen.getByRole('dialog')).toHaveTextContent('No quests yet');
  });

  it('switches to the overview, summarising standing and fulfilled prerequisites', async () => {
    channel.value = COMPLETED_CHAIN;
    const user = userEvent.setup();
    render(<QuestLog />);
    await user.keyboard('q');

    await user.click(screen.getByRole('button', { name: 'Overview' }));

    const dialog = screen.getByRole('dialog');
    // 2 of 3 done → 67%.
    expect(dialog).toHaveTextContent('67%');
    expect(dialog).toHaveTextContent('2 of 3 quests completed');
    // The completed quest that cleared a prerequisite names it.
    expect(dialog).toHaveTextContent('Prerequisites met');
    expect(dialog).toHaveTextContent('Gather the keys');
    // The standalone completed quest reports having had no prerequisites.
    expect(dialog).toHaveTextContent('No prerequisites');
    // An active quest never appears among the completion tiles.
    expect(dialog).not.toHaveTextContent('Guard the road');
  });

  it('returns to the log when an overview tile is clicked', async () => {
    channel.value = COMPLETED_CHAIN;
    const user = userEvent.setup();
    render(<QuestLog />);
    await user.keyboard('q');

    await user.click(screen.getByRole('button', { name: 'Overview' }));
    await user.click(
      screen.getByRole('button', {
        name: 'Open the vault, completed — open in the quest log',
      })
    );

    // Back on the log view: the Active heading and counts are visible again.
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Active');
    expect(dialog).toHaveTextContent('Guard the road');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
