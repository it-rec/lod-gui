import { useCallback, useRef, useState } from 'react';

// Minimal sortable-list primitive built on the HTML5 drag-and-drop API so
// there is zero runtime dependency. Returns drag/keyboard handlers for each
// row plus enough state to render a drop indicator.
//
// Usage:
//   const { dragIndex, overIndex, getItemProps, getHandleProps, move } =
//     useSortable(items, onReorder);
//   <li {...getItemProps(index)} className={overIndex === index ? 'over' : ''}>
//     <button {...getHandleProps(index, id)}>≡</button>
//     ...
//   </li>
//
// `move` accepts an absolute index move; `getHandleProps` already wires
// ArrowUp/ArrowDown for keyboard reordering.

const moveItem = (items, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const copy = items.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

export const useSortable = (items, onReorder) => {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  // Keep latest items in a ref so handlers don't capture stale arrays.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const finalise = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const move = useCallback(
    (from, to) => {
      const current = itemsRef.current;
      const reordered = moveItem(current, from, to);
      if (reordered !== current) onReorder(reordered);
    },
    [onReorder]
  );

  const getItemProps = useCallback(
    (index) => ({
      onDragOver: (event) => {
        if (dragIndex == null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (overIndex !== index) setOverIndex(index);
      },
      onDrop: (event) => {
        if (dragIndex == null) return;
        event.preventDefault();
        move(dragIndex, index);
        finalise();
      },
    }),
    [dragIndex, overIndex, move, finalise]
  );

  const getHandleProps = useCallback(
    (index, label) => ({
      draggable: true,
      role: 'button',
      tabIndex: 0,
      'aria-label': label
        ? `Reorder ${label} (drag, or press arrow keys)`
        : 'Reorder (drag, or press arrow keys)',
      'aria-grabbed': dragIndex === index ? 'true' : 'false',
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = 'move';
        // Some browsers need data set to start a drag.
        try {
          event.dataTransfer.setData('text/plain', String(index));
        } catch {
          /* ignore */
        }
        setDragIndex(index);
        setOverIndex(index);
      },
      onDragEnd: finalise,
      onKeyDown: (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          move(index, index - 1);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(index, index + 1);
        }
      },
    }),
    [dragIndex, move, finalise]
  );

  return { dragIndex, overIndex, getItemProps, getHandleProps, move };
};
