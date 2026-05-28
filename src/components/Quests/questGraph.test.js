import { describe, it, expect } from 'vitest';
import { layoutQuestGraph } from './questGraph';

describe('layoutQuestGraph', () => {
  it('returns empty layout for an empty list', () => {
    const layout = layoutQuestGraph([]);
    expect(layout).toEqual({ nodes: [], edges: [], width: 32, height: 32 });
  });

  it('places independent quests on layer 0', () => {
    const layout = layoutQuestGraph([
      { id: 'a', title: 'A', isDone: false, dependsOn: [] },
      { id: 'b', title: 'B', isDone: false, dependsOn: [] },
    ]);
    expect(layout.nodes).toHaveLength(2);
    expect(layout.nodes.every((n) => n.layer === 0)).toBe(true);
  });

  it('places a quest one layer past its deepest dependency', () => {
    const layout = layoutQuestGraph([
      { id: 'root', title: 'Root', isDone: false, dependsOn: [] },
      { id: 'mid',  title: 'Mid',  isDone: false, dependsOn: ['root'] },
      { id: 'leaf', title: 'Leaf', isDone: false, dependsOn: ['mid'] },
    ]);
    expect(layout.nodes.find((n) => n.id === 'root').layer).toBe(0);
    expect(layout.nodes.find((n) => n.id === 'mid').layer).toBe(1);
    expect(layout.nodes.find((n) => n.id === 'leaf').layer).toBe(2);
  });

  it('takes the max layer of multiple dependencies', () => {
    const layout = layoutQuestGraph([
      { id: 'a',    title: 'A',    isDone: false, dependsOn: [] },
      { id: 'b',    title: 'B',    isDone: false, dependsOn: ['a'] },
      { id: 'c',    title: 'C',    isDone: false, dependsOn: ['b'] }, // layer 2
      { id: 'fin',  title: 'Fin',  isDone: false, dependsOn: ['a', 'c'] }, // layer 3, not 1
    ]);
    expect(layout.nodes.find((n) => n.id === 'fin').layer).toBe(3);
  });

  it('emits one edge per (parent → child) dependency', () => {
    const layout = layoutQuestGraph([
      { id: 'a',    title: 'A',    isDone: false, dependsOn: [] },
      { id: 'b',    title: 'B',    isDone: false, dependsOn: ['a'] },
      { id: 'fin',  title: 'Fin',  isDone: false, dependsOn: ['a', 'b'] },
    ]);
    expect(layout.edges).toEqual(
      expect.arrayContaining([
        { from: 'a', to: 'b' },
        { from: 'a', to: 'fin' },
        { from: 'b', to: 'fin' },
      ])
    );
    expect(layout.edges).toHaveLength(3);
  });

  it('drops dangling dependency references rather than crashing', () => {
    const layout = layoutQuestGraph([
      { id: 'a', title: 'A', isDone: false, dependsOn: ['ghost'] },
    ]);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toEqual([]);
  });

  it('survives a dependency cycle by placing cyclic nodes on layer 0', () => {
    const layout = layoutQuestGraph([
      { id: 'a', title: 'A', isDone: false, dependsOn: ['b'] },
      { id: 'b', title: 'B', isDone: false, dependsOn: ['a'] },
    ]);
    expect(layout.nodes.find((n) => n.id === 'a').layer).toBe(0);
    expect(layout.nodes.find((n) => n.id === 'b').layer).toBe(0);
  });

  it('computes canvas width/height that contains every node', () => {
    const layout = layoutQuestGraph([
      { id: 'a', title: 'A', isDone: false, dependsOn: [] },
      { id: 'b', title: 'B', isDone: false, dependsOn: ['a'] },
      { id: 'c', title: 'C', isDone: false, dependsOn: ['a'] },
    ]);
    for (const n of layout.nodes) {
      expect(n.x + n.width).toBeLessThanOrEqual(layout.width);
      expect(n.y + n.height).toBeLessThanOrEqual(layout.height);
    }
  });
});
