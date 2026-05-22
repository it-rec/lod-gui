import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipEditor from './ChipEditor';

const Harness = () => {
  const [values, setValues] = useState([]);
  return (
    <ChipEditor
      values={values}
      onChange={setValues}
      placeholder="add"
      ariaLabel="New trait"
    />
  );
};

describe('ChipEditor', () => {
  it('adds a chip on Enter and removes it again', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('New trait'), 'Brave{Enter}');
    expect(screen.getByText('Brave')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Brave' }));
    expect(screen.queryByText('Brave')).not.toBeInTheDocument();
  });

  it('ignores duplicate entries', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('New trait');

    await user.type(input, 'Loyal{Enter}');
    await user.type(input, 'Loyal{Enter}');

    expect(screen.getAllByText('Loyal')).toHaveLength(1);
  });
});
