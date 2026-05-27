import { setTimeout as wait } from 'node:timers/promises';

const LOCATIONS = {
  locations: [
    { id: 'l-grey', name: 'Greycross',    status: 'home',    region: 'Vale',  notes: 'The party\'s seat.', x: 22, y: 64 },
    { id: 'l-mill', name: 'The Old Mill', status: 'visited', region: 'Vale',  notes: '', x: 36, y: 78 },
    { id: 'l-fox',  name: 'Foxglove',     status: 'visited', region: 'Vale',  notes: '', x: 48, y: 50 },
    { id: 'l-bron', name: 'Bronze Bridge',status: 'visited', region: 'Wolds', notes: '', x: 62, y: 38 },
    { id: 'l-bar',  name: 'Long Barrow',  status: 'rumored', region: 'Wolds', notes: 'A barrow under heather.', x: 78, y: 22 },
    { id: 'l-mar',  name: 'Marrowdale',   status: 'rumored', region: 'North', notes: '', x: 80, y: 60 },
    { id: 'l-pier', name: 'Salt-Piers',   status: 'lost',    region: 'Coast', notes: 'Lost to the sea storms.', x: 14, y: 30 },
  ],
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('locations', LOCATIONS);

  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 1200 });
  // Pre-set the panel's view preference to "map" so the page opens straight
  // into the new view.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lod:pref:locations-view', JSON.stringify('map'));
  });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await wait(300);

  const clip = await page.evaluate(() => {
    const surface = document.querySelector('[data-testid="locations-map-surface"]');
    if (!surface) return null;
    // Climb to the panel section so the screenshot includes the panel header.
    const panel = surface.closest('section') || surface;
    const r = panel.getBoundingClientRect();
    const pad = 16;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  if (!clip) throw new Error('Could not locate the locations map surface');
  await page.screenshot({ path: `${OUT}/locations-map.png`, clip });
  await page.close();
};
