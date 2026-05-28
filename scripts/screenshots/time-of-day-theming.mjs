// One screenshot per time-of-day phase, plus a 2x2 contact sheet that
// summarises the whole feature in a single image for the README/PR body.
import { setTimeout as wait } from 'node:timers/promises';

const PHASES = ['morning', 'afternoon', 'evening', 'night'];

const captureHeader = async (page, file) => {
  const region = await page.evaluate(() => {
    const el = document.querySelector('.app__top');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.floor(r.left),
      y: 0,
      width: Math.ceil(r.width),
      height: Math.ceil(r.bottom) + 24,
    };
  });
  await page.screenshot({ path: file, clip: region });
};

export default async ({ browser, seed, newPage, OUT, APP }) => {
  const files = {};
  for (const time of PHASES) {
    await seed('calendar', { day: 1, time, adventure: 'A Quiet Errand' });
    const page = await newPage(browser);
    await page.goto(APP, { waitUntil: 'networkidle0' });
    // Let the tint transition (0.6s) finish before snapping.
    await wait(800);
    const file = `${OUT}/time-of-day-${time}.png`;
    await captureHeader(page, file);
    files[time] = file;
    await page.close();
  }

  // Contact sheet: render the 4 PNGs side-by-side via a tiny inline page so
  // the docs/PR body can embed one image instead of four.
  const fs = await import('node:fs/promises');
  const dataUrls = {};
  for (const t of PHASES) {
    const buf = await fs.readFile(files[t]);
    dataUrls[t] = `data:image/png;base64,${buf.toString('base64')}`;
  }
  const sheet = await newPage(browser);
  await sheet.setViewport({ width: 1280, height: 720 });
  await sheet.setContent(`
    <style>
      body { margin: 0; background: #1a120a; font-family: Georgia, serif; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px; }
      figure { margin: 0; background: #0c0805; border-radius: 6px; overflow: hidden; }
      img { display: block; width: 100%; height: auto; }
      figcaption { color: #e9d08a; padding: 6px 12px; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; }
    </style>
    <div class="grid">
      ${PHASES.map((t) => `
        <figure>
          <img src="${dataUrls[t]}" alt="${t}">
          <figcaption>${t}</figcaption>
        </figure>`).join('')}
    </div>
  `);
  await wait(150);
  await sheet.screenshot({ path: `${OUT}/time-of-day-theming.png` });
  await sheet.close();
};
