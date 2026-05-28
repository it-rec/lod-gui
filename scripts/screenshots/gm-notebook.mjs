import { setTimeout as wait } from 'node:timers/promises';

export default async ({ browser, newPage, OUT, APP }) => {
  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });

  // Pre-seed the GM notebook with some private content so the screenshot
  // shows the panel in use rather than empty.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      'lod:pref:gm-notebook',
      JSON.stringify(
        [
          'Plot threads:',
          '- The duke knows the seal is forged',
          '- Mira’s real name is Astrid Vellance',
          '- Whatever is in the well is older than the village',
          '',
          'If they ask about the orchard, hand-wave — the truth comes out in Act III.',
        ].join('\n')
      )
    );
  });

  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the notebook popover.
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="GM notebook (private)"]');
    if (btn) btn.click();
  });
  await wait(300);

  // Crop to the popover plus the trigger so the screenshot tells the
  // whole story (header icon → drawer below it).
  const clip = await page.evaluate(() => {
    const trigger = document.querySelector('button[aria-label="GM notebook (private)"]');
    const dialog = document.querySelector('[role="dialog"][aria-label="GM notebook"]');
    const t = trigger.getBoundingClientRect();
    const d = dialog.getBoundingClientRect();
    const left = Math.min(t.left, d.left) - 16;
    const right = Math.max(t.right, d.right) + 16;
    const top = Math.min(t.top, d.top) - 16;
    const bottom = Math.max(t.bottom, d.bottom) + 16;
    return {
      x: Math.max(0, Math.floor(left)),
      y: Math.max(0, Math.floor(top)),
      width: Math.ceil(right - left),
      height: Math.ceil(bottom - top),
    };
  });
  await page.screenshot({ path: `${OUT}/gm-notebook.png`, clip });
  await page.close();
};
