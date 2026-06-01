import { setTimeout as wait } from 'node:timers/promises';

// The standing summary after a long campaign: many fulfilled pledges, several
// chained off earlier ones, so the overview can attest to a whole tapestry of
// prerequisites already cleared — and a couple still outstanding.
const QUESTS = {
  quests: [
    { id: 'q-find',   title: 'Find the missing heir',     notes: '', isDone: true,  dependsOn: [] },
    { id: 'q-seal',   title: 'Recover the ducal seal',    notes: '', isDone: true,  dependsOn: ['q-find'] },
    { id: 'q-throne', title: 'Restore the rightful heir', notes: '', isDone: true,  dependsOn: ['q-seal'] },
    { id: 'q-rumor',  title: 'Hear the orchard rumor',    notes: '', isDone: true,  dependsOn: [] },
    { id: 'q-rite',   title: 'Calm the orchard spirits',  notes: '', isDone: true,  dependsOn: ['q-rumor'] },
    { id: 'q-relic',  title: 'Find the sunken relic',     notes: '', isDone: true,  dependsOn: [] },
    { id: 'q-wyrm',   title: 'Slay the marsh wyrm',       notes: '', isDone: true,  dependsOn: ['q-relic'] },
    { id: 'q-pact',   title: 'Broker the border pact',    notes: '', isDone: true,  dependsOn: ['q-throne'] },
    { id: 'q-bridge', title: 'Rebuild the Greycross span', notes: '', isDone: true, dependsOn: [] },
    { id: 'q-watch',  title: 'Light the warning beacons', notes: '', isDone: true,  dependsOn: ['q-pact'] },
    { id: 'q-guard',  title: 'Guard the mountain road',   notes: '', isDone: false, dependsOn: [] },
    { id: 'q-crown',  title: 'Forge the iron crown',      notes: '', isDone: false, dependsOn: ['q-throne'] },
  ],
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('quests', QUESTS);

  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await wait(300);

  // Summon the log, then flip it to the standing overview.
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Quest log (Q)"]')?.click();
  });
  await wait(300);
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[role="dialog"] button')];
    buttons.find((b) => b.textContent.trim() === 'Overview')?.click();
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
  await page.screenshot({ path: `${OUT}/quest-overview.png`, clip });
  await page.close();
};
