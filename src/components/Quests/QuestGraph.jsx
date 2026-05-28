import { useMemo, useState } from 'react';
import cx from 'classnames';
import { layoutQuestGraph } from './questGraph';
import { questIsUnlocked } from './Quests';
import styles from './QuestGraph.module.scss';

const ARROW_INSET = 12;

// Render the quest dependency DAG. Pure presentational: takes the raw
// quest list and draws only quests that the table actually knows about
// (i.e. completed or with every prerequisite satisfied). Locked quests
// are hidden entirely — matching how the Legacy of Dragonholt book reveals
// paragraphs only after they're unlocked.
const QuestGraph = ({ quests, onFocusQuest }) => {
  const [focusId, setFocusId] = useState(null);

  // Filter before laying out, so the graph grows as quests unlock instead
  // of spoiling the structure of what's coming.
  const visibleQuests = useMemo(
    () => quests.filter((q) => q.isDone || questIsUnlocked(q, quests)),
    [quests]
  );

  const layout = useMemo(() => layoutQuestGraph(visibleQuests), [visibleQuests]);

  if (quests.length === 0) {
    return (
      <p className={styles.empty}>
        No quests yet — pledge one above to start the writ.
      </p>
    );
  }
  if (visibleQuests.length === 0) {
    // Pathological case: every quest's dependencies point at a quest that
    // isn't itself reachable. The list view is still the place to untangle.
    return (
      <p className={styles.empty}>
        Nothing to draw yet — every quest is waiting on a prerequisite.
      </p>
    );
  }

  const focused = focusId
    ? visibleQuests.find((q) => q.id === focusId)
    : null;

  const positionsById = new Map(layout.nodes.map((n) => [n.id, n]));

  const select = (id) => {
    setFocusId(id);
    onFocusQuest?.(id);
  };

  return (
    <div className={styles.surface}>
      <div className={styles.scroll}>
        <svg
          className={styles.canvas}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Quest dependency graph"
        >
          <defs>
            <marker
              id="quest-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
            </marker>
          </defs>

          {layout.edges.map((edge, idx) => {
            const a = positionsById.get(edge.from);
            const b = positionsById.get(edge.to);
            if (!a || !b) return null;
            const x1 = a.x + a.width;
            const y1 = a.y + a.height / 2;
            const x2 = b.x - ARROW_INSET;
            const y2 = b.y + b.height / 2;
            const midX = (x1 + x2) / 2;
            // Smooth horizontal bezier so columns of arrows don't overlap.
            const path = `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;
            // Every edge in a visible-only graph starts from a completed
            // quest, so the parent-done highlight is always on.
            return (
              <path
                key={`${edge.from}-${edge.to}-${idx}`}
                d={path}
                className={cx(styles.edge, styles.edgeUnlocked)}
                markerEnd="url(#quest-arrow)"
                fill="none"
              />
            );
          })}

          {layout.nodes.map((node) => (
            <g
              key={node.id}
              className={cx(styles.node, {
                [styles.nodeDone]: node.isDone,
                [styles.nodeFocused]: node.id === focusId,
              })}
              transform={`translate(${node.x},${node.y})`}
              onClick={() => select(node.id)}
              tabIndex={0}
              role="button"
              aria-label={`${node.title}${node.isDone ? ' (completed)' : ''}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  select(node.id);
                }
              }}
              data-testid={`graph-node-${node.id}`}
            >
              <rect
                className={styles.nodeBox}
                width={node.width}
                height={node.height}
                rx="6"
                ry="6"
              />
              <text
                className={styles.nodeTitle}
                x={node.width / 2}
                y={node.height / 2 + 4}
                textAnchor="middle"
              >
                {node.title.length > 22 ? `${node.title.slice(0, 20)}…` : node.title}
              </text>
              {node.isDone && (
                <text
                  className={styles.nodeBadge}
                  x={node.width - 8}
                  y={14}
                  textAnchor="end"
                >
                  ✓
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      {focused && (
        <div
          role="dialog"
          aria-label={`${focused.title} details`}
          className={styles.detail}
        >
          <p className={styles.detailTitle}>{focused.title}</p>
          <p className={styles.detailStatus}>
            {focused.isDone ? 'Completed' : 'Active'}
          </p>
          {focused.notes && (
            <p className={styles.detailNotes}>{focused.notes}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestGraph;
