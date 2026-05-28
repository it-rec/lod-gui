import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceMacros } from './useDiceMacros';

beforeEach(() => {
  window.localStorage.clear();
});

describe('useDiceMacros', () => {
  it('starts empty when nothing is persisted', () => {
    const { result } = renderHook(() => useDiceMacros());
    expect(result.current.macros).toEqual([]);
  });

  it('adds a macro and persists it to localStorage', () => {
    const { result } = renderHook(() => useDiceMacros());
    act(() => {
      result.current.add('Longsword attack', '1d20+5');
    });
    expect(result.current.macros).toHaveLength(1);
    expect(result.current.macros[0]).toMatchObject({
      name: 'Longsword attack',
      expression: '1d20+5',
    });
    const stored = JSON.parse(window.localStorage.getItem('lod:pref:dice-macros'));
    expect(stored[0]).toMatchObject({
      name: 'Longsword attack',
      expression: '1d20+5',
    });
  });

  it('overwrites a macro with the same name (case-insensitive)', () => {
    const { result } = renderHook(() => useDiceMacros());
    act(() => {
      result.current.add('Heal', '1d4+2');
      result.current.add('heal', '2d4+3');
    });
    expect(result.current.macros).toHaveLength(1);
    expect(result.current.macros[0].expression).toBe('2d4+3');
  });

  it('refuses empty names and empty expressions', () => {
    const { result } = renderHook(() => useDiceMacros());
    act(() => {
      result.current.add('', '1d6');
      result.current.add('Empty', '   ');
    });
    expect(result.current.macros).toEqual([]);
  });

  it('removes a macro by id', () => {
    const { result } = renderHook(() => useDiceMacros());
    let entry;
    act(() => {
      entry = result.current.add('Sneak', '1d20+8');
    });
    act(() => {
      result.current.remove(entry.id);
    });
    expect(result.current.macros).toEqual([]);
  });

  it('rehydrates persisted macros on mount', () => {
    window.localStorage.setItem(
      'lod:pref:dice-macros',
      JSON.stringify([
        { id: 'a', name: 'Shortbow', expression: '1d20+4' },
        { id: 'b', name: 'Damage', expression: '1d6+2' },
      ])
    );
    const { result } = renderHook(() => useDiceMacros());
    expect(result.current.macros).toHaveLength(2);
    expect(result.current.macros[0].name).toBe('Shortbow');
  });

  it('caps the stored list at 12 macros', () => {
    const { result } = renderHook(() => useDiceMacros());
    act(() => {
      for (let i = 0; i < 20; i += 1) {
        result.current.add(`Roll ${i}`, `1d20+${i}`);
      }
    });
    expect(result.current.macros).toHaveLength(12);
  });
});
