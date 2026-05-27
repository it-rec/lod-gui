import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockState = { value: { time: 'morning' } };

vi.mock('./useGameChannel', () => ({
  useGameChannel: ({ fromServer }) => ({
    value: fromServer ? fromServer(mockState.value) : mockState.value,
    save: vi.fn(),
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

import { useTimeOfDayTheme } from './useTimeOfDayTheme';

describe('useTimeOfDayTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-time-of-day');
    mockState.value = { time: 'morning' };
  });

  it('mirrors the calendar phase onto <html data-time-of-day>', () => {
    mockState.value = { time: 'evening' };
    renderHook(() => useTimeOfDayTheme());
    expect(document.documentElement.getAttribute('data-time-of-day')).toBe(
      'evening'
    );
  });

  it('falls back to morning when the server payload has an unknown phase', () => {
    mockState.value = { time: 'twilight' };
    renderHook(() => useTimeOfDayTheme());
    expect(document.documentElement.getAttribute('data-time-of-day')).toBe(
      'morning'
    );
  });

  it('updates the attribute when the phase changes between renders', () => {
    mockState.value = { time: 'morning' };
    const { rerender } = renderHook(() => useTimeOfDayTheme());
    expect(document.documentElement.getAttribute('data-time-of-day')).toBe(
      'morning'
    );
    act(() => {
      mockState.value = { time: 'night' };
    });
    rerender();
    expect(document.documentElement.getAttribute('data-time-of-day')).toBe(
      'night'
    );
  });
});
