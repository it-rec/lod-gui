import { setTimeout as wait } from 'node:timers/promises';

const HEROES = {
  heroes: [
    { id: 'h-mira', name: 'Mira', species: 'Human', background: 'Scout' },
    { id: 'h-bram', name: 'Bram', species: 'Dwarf', background: 'Soldier' },
    { id: 'h-sela', name: 'Sela', species: 'Elf',   background: 'Mage' },
  ],
};
const QUESTS = {
  quests: [
    { id: 'q1', title: 'Find the missing heir', notes: '', isDone: false, dependsOn: [] },
    { id: 'q2', title: 'Calm the orchard',      notes: '', isDone: false, dependsOn: [] },
    { id: 'q3', title: 'Recover the duke\'s seal', notes: '', isDone: true,  dependsOn: [] },
  ],
};
const NPCS = {
  npcs: [
    { id: 'n1', name: 'Edda the well-keeper', role: 'ally',    location: 'Greycross', notes: '' },
    { id: 'n2', name: 'Halgar Stoneblood',    role: 'foe',     location: 'The Mill',   notes: '' },
    { id: 'n3', name: 'Toll-keeper at the bridge', role: 'neutral', location: 'East road', notes: '' },
  ],
};
const LOCATIONS = {
  locations: [
    { id: 'l1', name: 'Greycross',  status: 'home',    region: 'Vale',  notes: '' },
    { id: 'l2', name: 'The Mill',   status: 'visited', region: 'Vale',  notes: '' },
    { id: 'l3', name: 'Long Barrow', status: 'rumored', region: 'Wolds', notes: '' },
  ],
};
const JOURNAL = {
  entries: [
    { id: 'j1', day: 7, time: 'evening',   text: 'Met Edda at the well; she vouched for Sela’s charm.',  author: 'Mira', createdAt: '2026-05-27T19:00:00.000Z' },
    { id: 'j2', day: 7, time: 'afternoon', text: 'Bram bartered for two waterskins and a coil of rope.',     author: 'Bram', createdAt: '2026-05-27T14:00:00.000Z' },
    { id: 'j3', day: 7, time: 'morning',   text: 'Crossed the bridge under a flat grey sky.',                author: 'Sela', createdAt: '2026-05-27T09:00:00.000Z' },
    { id: 'j4', day: 6, time: 'night',     text: 'Slept under the oaks; took watches in pairs.',             author: 'Mira', createdAt: '2026-05-26T22:00:00.000Z' },
  ],
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('calendar', { day: 7, time: 'evening', adventure: 'A Quiet Errand' });
  await seed('gold', { gold: 42 });
  await seed('fame', { fame: 3 });
  await seed('heroes', HEROES);
  await seed('quests', QUESTS);
  await seed('npcs', NPCS);
  await seed('locations', LOCATIONS);
  await seed('journal', JOURNAL);

  const page = await newPage(browser);
  // Tall viewport so the modal isn't internally scrolled when captured.
  await page.setViewport({ width: 1280, height: 1500 });
  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the campaign menu, then click "Session recap…".
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Campaign menu"]').click();
  });
  await wait(150);
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    const recap = items.find((el) => el.textContent.includes('Session recap'));
    if (recap) recap.click();
  });
  await wait(300);

  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Session recap"]');
    const r = dialog.getBoundingClientRect();
    const pad = 28;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  await page.screenshot({ path: `${OUT}/session-recap.png`, clip });
  await page.close();
};
