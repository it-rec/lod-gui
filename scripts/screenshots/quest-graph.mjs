import { setTimeout as wait } from 'node:timers/promises';

// A small storyline with branching prerequisites so the graph has
// something to draw: two parallel roots, a mid quest that joins them,
// a leaf that depends on the mid, and one completed prerequisite.
const QUESTS = {
  quests: [
    { id: 'q-rumor',  title: 'Hear the orchard rumor', notes: '',                 isDone: true,  dependsOn: [] },
    { id: 'q-find',   title: 'Find the missing heir',  notes: 'Start in Greycross.', isDone: false, dependsOn: [] },
    { id: 'q-orch',   title: 'Calm the orchard',       notes: '',                 isDone: false, dependsOn: ['q-rumor'] },
    { id: 'q-seal',   title: 'Recover the seal',       notes: 'Inside the manor.', isDone: false, dependsOn: ['q-find'] },
    { id: 'q-coron',  title: 'Coronation at Bronze',   notes: '',                 isDone: false, dependsOn: ['q-seal', 'q-orch'] },
    { id: 'q-route',  title: 'Open the river road',    notes: '',                 isDone: false, dependsOn: ['q-orch'] },
  ],
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('quests', QUESTS);

  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 1200 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lod:pref:quests-view', JSON.stringify('graph'));
  });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await wait(300);

  // Click "Find the missing heir" so the detail panel appears, making the
  // screenshot show both the graph and a "focused quest" state. Locked
  // quests are deliberately hidden from the view, so we can't focus those.
  await page.evaluate(() => {
    const node = document.querySelector('[data-testid="graph-node-q-find"]');
    if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await wait(150);

  const clip = await page.evaluate(() => {
    const svg = document.querySelector('[role="img"][aria-label="Quest dependency graph"]');
    if (!svg) return null;
    const panel = svg.closest('section') || svg;
    const r = panel.getBoundingClientRect();
    const pad = 16;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  if (!clip) throw new Error('Could not find the quest graph');
  await page.screenshot({ path: `${OUT}/quest-graph.png`, clip });
  await page.close();
};
