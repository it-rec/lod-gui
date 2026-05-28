import { setTimeout as wait } from 'node:timers/promises';

export default async ({ browser, newPage, OUT, APP }) => {
  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });

  // Pre-fix a volume preference so the slider isn't pinned at default.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lod:pref:soundscape-volume', JSON.stringify(0.55));
  });

  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the soundscape popover.
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Ambient soundscape"]');
    if (btn) btn.click();
  });
  await wait(200);

  // Click Forest so it becomes the active scene. (Headless Chrome will
  // create an AudioContext but won't actually play through the host's
  // speakers.)
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('[role="radio"]'));
    const forest = radios.find((r) => r.textContent.trim() === 'Forest');
    if (forest) forest.click();
  });
  await wait(200);

  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Ambient soundscape"]');
    const r = dialog.getBoundingClientRect();
    const pad = 24;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  await page.screenshot({ path: `${OUT}/soundscape.png`, clip });
  await page.close();
};
