import { setTimeout as wait } from 'node:timers/promises';

export default async ({ browser, seed, newPage, OUT, APP }) => {
  // Seed the party so the dialog has named heroes to share with.
  await seed('heroes', {
    heroes: [
      { id: 'h-mira', name: 'Mira', species: 'Human', background: 'Scout' },
      { id: 'h-bram', name: 'Bram', species: 'Dwarf', background: 'Soldier' },
      { id: 'h-sela', name: 'Sela', species: 'Elf',   background: 'Mage' },
    ],
  });
  await seed('gold', { gold: 12 });
  await seed('calendar', { day: 7, time: 'evening', adventure: 'A Quiet Errand' });

  const page = await newPage(browser);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP, { waitUntil: 'networkidle0' });

  // Open the modal.
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const trigger = buttons.find((b) => b.textContent.trim().startsWith('Split loot'));
    if (trigger) trigger.click();
  });
  await wait(300);

  // Type a total and the preview will update.
  await page.evaluate(() => {
    const input = document.querySelector('input[aria-label="Total gold found"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(input, '31');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await wait(200);

  const clip = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Split loot"]');
    const r = dialog.getBoundingClientRect();
    const pad = 28;
    return {
      x: Math.max(0, Math.floor(r.left) - pad),
      y: Math.max(0, Math.floor(r.top) - pad),
      width: Math.ceil(r.width) + pad * 2,
      height: Math.ceil(r.height) + pad * 2,
    };
  });
  await page.screenshot({ path: `${OUT}/loot-splitter.png`, clip });
  await page.close();
};
