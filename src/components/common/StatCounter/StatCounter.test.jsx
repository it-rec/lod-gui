import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatCounter from './StatCounter';

describe('StatCounter', () => {
  it('steps the value by one and by ten', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatCounter value={50} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add one' }));
    expect(onChange).toHaveBeenLastCalledWith(51);

    await user.click(screen.getByRole('button', { name: 'Add ten' }));
    expect(onChange).toHaveBeenLastCalledWith(60);

    await user.click(screen.getByRole('button', { name: 'Subtract ten' }));
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it('never drops below zero', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatCounter value={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Subtract ten' }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('accepts a typed number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatCounter value={0} onChange={onChange} />);

    const input = screen.getByLabelText('Current amount');
    await user.clear(input);
    await user.type(input, '123');
    expect(onChange).toHaveBeenLastCalledWith(123);
  });
});
