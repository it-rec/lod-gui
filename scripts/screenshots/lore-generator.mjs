import { setTimeout as wait } from 'node:timers/promises';

export default async ({ browser, newPage, OUT, APP }) => {
  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the Lore Generator popover.
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Lore generator"]');
    if (btn) btn.click();
  });
  await wait(250);

  // Capture the popover region (plus a comfortable margin) instead of the
  // whole header — it's a focused UI element.
  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Lore generator"]');
    const r = dialog.getBoundingClientRect();
    const pad = 24;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  await page.screenshot({ path: `${OUT}/lore-generator.png`, clip });
  await page.close();
};
