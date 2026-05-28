// Stable auto-layout for locations that haven't been placed by hand yet.
// Returns an object keyed by location.id mapping to {x, y} percentages
// in the 0..100 range. Locations with persisted coords keep them;
// unpositioned entries get tidy grid slots so a fresh map is at least
// glanceable.

const PADDING = 8;       // percent from edges
const AVAILABLE = 100 - PADDING * 2;

export const autoLayout = (locations) => {
  const positions = {};
  const unpositioned = [];
  for (const loc of locations) {
    if (typeof loc.x === 'number' && typeof loc.y === 'number') {
      positions[loc.id] = { x: loc.x, y: loc.y };
    } else {
      unpositioned.push(loc);
    }
  }
  if (!unpositioned.length) return positions;

  const cols = Math.max(1, Math.ceil(Math.sqrt(unpositioned.length)));
  const rows = Math.max(1, Math.ceil(unpositioned.length / cols));
  const stepX = cols > 1 ? AVAILABLE / (cols - 1) : 0;
  const stepY = rows > 1 ? AVAILABLE / (rows - 1) : 0;

  unpositioned.forEach((loc, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = cols === 1 ? 50 : PADDING + stepX * col;
    const y = rows === 1 ? 50 : PADDING + stepY * row;
    positions[loc.id] = { x, y };
  });
  return positions;
};
