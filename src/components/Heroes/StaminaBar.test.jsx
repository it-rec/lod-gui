import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StaminaBar from './StaminaBar';

describe('StaminaBar', () => {
  it('loses, restores and rests stamina', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StaminaBar current={8} max={12} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Lose a point of stamina' }));
    expect(onChange).toHaveBeenLastCalledWith({ current: 7, max: 12 });

    await user.click(
      screen.getByRole('button', { name: 'Restore a point of stamina' })
    );
    expect(onChange).toHaveBeenLastCalledWith({ current: 9, max: 12 });

    await user.click(screen.getByRole('button', { name: 'Rest' }));
    expect(onChange).toHaveBeenLastCalledWith({ current: 12, max: 12 });
  });

  it('disables losing at zero and resting at full health', () => {
    const { rerender } = render(
      <StaminaBar current={0} max={12} onChange={() => {}} />
    );
    expect(
      screen.getByRole('button', { name: 'Lose a point of stamina' })
    ).toBeDisabled();

    rerender(<StaminaBar current={12} max={12} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Rest' })).toBeDisabled();
  });
});
