import { setTimeout as wait } from 'node:timers/promises';

// A small storyline that exercises every state the log renders: a couple of
// active quests with notes, a quest blocked by an unfinished prerequisite,
// and two already-fulfilled pledges below the fold.
const QUESTS = {
  quests: [
    { id: 'q-find',  title: 'Find the missing heir',  notes: 'Last seen in **Greycross** before the spring fair.', isDone: false, dependsOn: [] },
    { id: 'q-orch',  title: 'Calm the orchard spirits', notes: 'The well-keeper knows an old rite.',                 isDone: false, dependsOn: [] },
    { id: 'q-seal',  title: 'Recover the ducal seal',  notes: 'Hidden somewhere inside the manor.',                 isDone: false, dependsOn: ['q-find'] },
    { id: 'q-rumor', title: 'Hear the orchard rumor',  notes: '',                                                   isDone: true,  dependsOn: [] },
    { id: 'q-letter',title: 'Deliver the sealed letter', notes: '',                                                 isDone: true,  dependsOn: [] },
  ],
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('quests', QUESTS);

  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await wait(300);

  // Summon the log the unobtrusive way — the header button.
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Quest log (Q)"]');
    if (btn) btn.click();
  });
  await wait(300);

  // Crop to the modal box itself (the dialog role sits on the backdrop).
  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Quest log"]');
    if (!dialog) return null;
    const box = dialog.firstElementChild || dialog;
    const r = box.getBoundingClientRect();
    const pad = 24;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  if (!clip) throw new Error('Could not find the quest log');
  await page.screenshot({ path: `${OUT}/quest-log.png`, clip });
  await page.close();
};
