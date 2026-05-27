// Lay out a quest list as a left-to-right DAG of layers, where each layer
// holds quests whose every dependency is in an earlier layer. Pure
// function — no DOM access, no React — so the layout can be unit-tested
// directly.

const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const COL_GAP = 56;
const ROW_GAP = 20;
const PADDING = 16;

// Filters dependencies down to ones that point to a quest in the same set.
// Dangling references are ignored — they're treated as satisfied by
// `questIsUnlocked` and would otherwise pin a quest to an indefinite layer.
const cleanDeps = (quest, byId) =>
  (quest.dependsOn || []).filter((id) => byId.has(id));

// Returns a map of id → layer index (0-based). Quests in a dependency
// cycle get layer 0 so they still appear, even if the edges form a loop.
const computeLayers = (quests, byId) => {
  const layer = new Map();
  const queue = [];

  // Roots have no in-set dependencies.
  for (const q of quests) {
    if (cleanDeps(q, byId).length === 0) {
      layer.set(q.id, 0);
      queue.push(q.id);
    }
  }

  // BFS down the dependency graph. We use children lookup, not parents.
  const children = new Map();
  for (const q of quests) {
    for (const dep of cleanDeps(q, byId)) {
      if (!children.has(dep)) children.set(dep, []);
      children.get(dep).push(q.id);
    }
  }

  while (queue.length) {
    const id = queue.shift();
    for (const childId of children.get(id) || []) {
      const child = byId.get(childId);
      const deps = cleanDeps(child, byId);
      // A child can only be placed once every parent has its layer assigned.
      if (deps.every((d) => layer.has(d))) {
        const next = Math.max(...deps.map((d) => layer.get(d))) + 1;
        const prev = layer.get(childId);
        if (prev === undefined || next > prev) {
          layer.set(childId, next);
          queue.push(childId);
        }
      }
    }
  }

  // Anything left over is in a dependency cycle; drop them on layer 0.
  for (const q of quests) {
    if (!layer.has(q.id)) layer.set(q.id, 0);
  }
  return layer;
};

export const layoutQuestGraph = (quests, options = {}) => {
  const W = options.nodeWidth ?? NODE_WIDTH;
  const H = options.nodeHeight ?? NODE_HEIGHT;
  const COL = options.colGap ?? COL_GAP;
  const ROW = options.rowGap ?? ROW_GAP;
  const PAD = options.padding ?? PADDING;

  const byId = new Map(quests.map((q) => [q.id, q]));
  if (quests.length === 0) {
    return { nodes: [], edges: [], width: PAD * 2, height: PAD * 2 };
  }

  const layer = computeLayers(quests, byId);

  // Bucket quests per layer, preserving original list order so renaming
  // doesn't shuffle the columns.
  const byLayer = new Map();
  for (const q of quests) {
    const l = layer.get(q.id) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l).push(q);
  }
  const layers = Array.from(byLayer.keys()).sort((a, b) => a - b);

  const nodes = [];
  const stepX = W + COL;
  const stepY = H + ROW;
  let maxRows = 0;

  for (const l of layers) {
    const bucket = byLayer.get(l);
    if (bucket.length > maxRows) maxRows = bucket.length;
    bucket.forEach((quest, idx) => {
      nodes.push({
        id: quest.id,
        title: quest.title,
        isDone: !!quest.isDone,
        layer: l,
        x: PAD + l * stepX,
        y: PAD + idx * stepY,
        width: W,
        height: H,
      });
    });
  }

  // Edges go from each dependency (parent) to the dependent (child).
  const positionsById = new Map(nodes.map((n) => [n.id, n]));
  const edges = [];
  for (const q of quests) {
    for (const dep of cleanDeps(q, byId)) {
      const from = positionsById.get(dep);
      const to = positionsById.get(q.id);
      if (from && to) edges.push({ from: dep, to: q.id });
    }
  }

  const width  = PAD * 2 + (layers.length - 1) * stepX + W;
  const height = PAD * 2 + (maxRows - 1) * stepY + H;
  return { nodes, edges, width, height };
};
