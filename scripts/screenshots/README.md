# Screenshot recipes

Each `.mjs` file here default-exports an async function that drives the
running app (`http://localhost:3000`) into a scripted scene and writes one
or more PNGs to `docs/screenshots/`.

```js
// scripts/screenshots/example.mjs
export default async ({ browser, seed, newPage, OUT, APP }) => {
  await seed('gold', 42);
  const page = await newPage(browser);
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT}/example.png` });
  await page.close();
};
```

Run one (`bun run screenshot example`) or all (`bun run screenshot --all`).
