// Capture the reaction picker and a single in-flight emoji.
import { setTimeout as wait } from 'node:timers/promises';

export default async ({ browser, newPage, OUT, APP }) => {
  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Fire several reactions so the page has emojis caught mid-flight.
  await page.evaluate(async () => {
    const labels = ['Applause', 'Critical hit', 'Cheers', 'Battle'];
    for (let i = 0; i < labels.length; i += 1) {
      const btn = document.querySelector(`button[aria-label="${labels[i]}"]`);
      if (btn) btn.click();
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  // Let the flyers reach mid-animation before snapping.
  await wait(700);

  // Crop to the bottom-right quadrant where both the picker and the
  // flying field live so the screenshot stays tight.
  const rect = await page.evaluate(() => {
    const picker = document.querySelector('[role="group"][aria-label="Table reactions"]');
    const p = picker.getBoundingClientRect();
    return {
      x: Math.max(0, Math.floor(p.left - 480)),
      y: Math.max(0, Math.floor(p.top - 560)),
      width: Math.ceil(p.right - Math.max(0, p.left - 480)) + 24,
      height: Math.ceil(p.bottom - Math.max(0, p.top - 560)) + 24,
    };
  });
  await page.screenshot({ path: `${OUT}/reactions.png`, clip: rect });
  await page.close();
};
