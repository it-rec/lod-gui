import { createContext } from 'react';

// Supplied by the Notebook when its panels are user-rearrangeable. Maps a
// panel's `collapsibleKey` to the drag props it should wire up:
//   { itemProps, handleProps, isDragging, isOver }
// It is null everywhere else, so panels outside a reorderable group render
// exactly as before.
export const PanelReorderContext = createContext(null);
