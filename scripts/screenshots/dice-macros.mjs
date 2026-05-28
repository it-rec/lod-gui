import { setTimeout as wait } from 'node:timers/promises';

const SEED_MACROS = [
  { id: 'm-attack', name: 'Longsword attack', expression: '1d20+5' },
  { id: 'm-damage', name: 'Longsword damage', expression: '1d8+3' },
  { id: 'm-sneak', name: 'Sneak', expression: '1d20+8' },
  { id: 'm-heal', name: 'Heal touch', expression: '2d4+2' },
];

export default async ({ browser, newPage, OUT, APP }) => {
  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });

  await page.evaluateOnNewDocument((macros) => {
    localStorage.setItem('lod:pref:dice-macros', JSON.stringify(macros));
  }, SEED_MACROS);

  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the dice roller.
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Open dice roller"]');
    if (btn) btn.click();
  });
  await wait(250);

  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Dice roller"]');
    const r = dialog.getBoundingClientRect();
    const pad = 16;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  await page.screenshot({ path: `${OUT}/dice-macros.png`, clip });
  await page.close();
};
