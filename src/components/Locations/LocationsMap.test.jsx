import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsMap from './LocationsMap';

const LOCATIONS = [
  { id: 'l1', name: 'Greycross',  status: 'home',    region: 'Vale',  notes: 'The party\'s seat.', x: 30, y: 40 },
  { id: 'l2', name: 'The Mill',   status: 'visited', region: 'Vale',  notes: '', x: 60, y: 55 },
  { id: 'l3', name: 'Long Barrow', status: 'rumored', region: 'Wolds', notes: 'A barrow under heather.', x: 80, y: 25 },
];

describe('LocationsMap', () => {
  it('renders an empty hint when there are no locations', () => {
    render(<LocationsMap locations={[]} onMove={() => {}} />);
    expect(screen.getByText(/Mark a place first/)).toBeInTheDocument();
  });

  it('renders one pin per location with its name label', () => {
    render(<LocationsMap locations={LOCATIONS} onMove={() => {}} />);
    for (const loc of LOCATIONS) {
      expect(screen.getByTestId(`pin-${loc.id}`)).toBeInTheDocument();
    }
    expect(screen.getByText('Greycross')).toBeInTheDocument();
    expect(screen.getByText('Long Barrow')).toBeInTheDocument();
  });

  it('positions pins at their persisted coords', () => {
    render(<LocationsMap locations={LOCATIONS} onMove={() => {}} />);
    const pin = screen.getByTestId('pin-l1');
    expect(pin).toHaveStyle({ left: '30%', top: '40%' });
  });

  it('clicking a pin opens a popover with name + status + region + notes', async () => {
    const user = userEvent.setup();
    render(<LocationsMap locations={LOCATIONS} onMove={() => {}} />);

    await user.click(screen.getByTestId('pin-l1'));

    const popover = screen.getByRole('dialog', { name: /Greycross details/ });
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent('Greycross');
    expect(popover).toHaveTextContent('Home');
    expect(popover).toHaveTextContent('Vale');
    expect(popover).toHaveTextContent('The party\'s seat.');
  });

  it('clicking the surface closes the popover', async () => {
    const user = userEvent.setup();
    render(<LocationsMap locations={LOCATIONS} onMove={() => {}} />);
    await user.click(screen.getByTestId('pin-l1'));
    expect(screen.getByRole('dialog', { name: /Greycross details/ })).toBeInTheDocument();

    await user.click(screen.getByTestId('locations-map-surface'));
    expect(screen.queryByRole('dialog', { name: /Greycross details/ })).toBeNull();
  });

  it('does not fire onMove for a click without movement', async () => {
    const onMove = vi.fn();
    const user = userEvent.setup();
    render(<LocationsMap locations={LOCATIONS} onMove={onMove} />);

    // A bare click counts as pointerdown + pointerup with no pointermove.
    await user.click(screen.getByTestId('pin-l2'));

    expect(onMove).not.toHaveBeenCalled();
  });
});
