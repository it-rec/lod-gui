import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Stepper from './Stepper';

describe('Stepper', () => {
  it('increments and decrements the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={3} onChange={onChange} label="level" />);

    await user.click(screen.getByRole('button', { name: 'Increase level' }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    await user.click(screen.getByRole('button', { name: 'Decrease level' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('disables the controls at the min and max bounds', () => {
    const { rerender } = render(
      <Stepper value={1} min={1} max={5} onChange={() => {}} label="rank" />
    );
    expect(screen.getByRole('button', { name: 'Decrease rank' })).toBeDisabled();

    rerender(<Stepper value={5} min={1} max={5} onChange={() => {}} label="rank" />);
    expect(screen.getByRole('button', { name: 'Increase rank' })).toBeDisabled();
  });

  it('shows the current value', () => {
    render(<Stepper value={7} onChange={() => {}} label="rank" />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
