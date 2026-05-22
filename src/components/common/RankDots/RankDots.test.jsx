import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RankDots from './RankDots';

describe('RankDots', () => {
  it('sets the rank to the clicked dot', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RankDots value={2} max={6} onChange={onChange} label="Lore rank" />);

    await user.click(screen.getByRole('button', { name: 'Set Lore rank to 5' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('marks every dot up to the value as pressed', () => {
    render(<RankDots value={3} max={6} onChange={() => {}} label="rank" />);

    const dots = screen.getAllByRole('button');
    expect(dots).toHaveLength(6);
    expect(
      dots.filter((dot) => dot.getAttribute('aria-pressed') === 'true')
    ).toHaveLength(3);
  });
});
