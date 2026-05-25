import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSortable } from './useSortable';

const items = ['a', 'b', 'c', 'd'];

describe('useSortable', () => {
  it('reorders via `move`', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortable(items, onReorder));
    act(() => result.current.move(0, 2));
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a', 'd']);
  });

  it('does nothing when the from/to index is identical or out of range', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortable(items, onReorder));
    act(() => result.current.move(1, 1));
    act(() => result.current.move(0, 99));
    act(() => result.current.move(-1, 0));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('handle keyboard arrows move the row up and down', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortable(items, onReorder));
    const props = result.current.getHandleProps(2, 'item C');
    act(() =>
      props.onKeyDown({
        key: 'ArrowUp',
        preventDefault: () => {},
      })
    );
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'c', 'b', 'd']);

    act(() =>
      result.current.getHandleProps(2, 'item C').onKeyDown({
        key: 'ArrowDown',
        preventDefault: () => {},
      })
    );
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'b', 'd', 'c']);
  });

  it('drag start/over/drop produces a reorder', () => {
    const onReorder = vi.fn();
    const { result, rerender } = renderHook(() =>
      useSortable(items, onReorder)
    );
    const fakeEvent = () => ({
      preventDefault: () => {},
      dataTransfer: {
        setData: () => {},
        dropEffect: '',
        effectAllowed: '',
      },
    });
    act(() => result.current.getHandleProps(0, 'a').onDragStart(fakeEvent()));
    rerender();
    expect(result.current.dragIndex).toBe(0);

    act(() => result.current.getItemProps(2).onDragOver(fakeEvent()));
    rerender();
    expect(result.current.overIndex).toBe(2);

    act(() => result.current.getItemProps(2).onDrop(fakeEvent()));
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a', 'd']);
  });

  it('a drag that ends without a drop clears state', () => {
    const onReorder = vi.fn();
    const { result, rerender } = renderHook(() =>
      useSortable(items, onReorder)
    );
    act(() =>
      result.current.getHandleProps(0, 'a').onDragStart({
        preventDefault: () => {},
        dataTransfer: { setData: () => {}, effectAllowed: '' },
      })
    );
    rerender();
    expect(result.current.dragIndex).toBe(0);

    act(() => result.current.getHandleProps(0, 'a').onDragEnd());
    rerender();
    expect(result.current.dragIndex).toBeNull();
  });
});
