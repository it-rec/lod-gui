#!/usr/bin/env bun
// Headless-browser screenshot harness for documentation.
//
//   bun run scripts/screenshot.mjs <recipe>      # one recipe
//   bun run scripts/screenshot.mjs --all          # every recipe under scripts/screenshots/
//
// Each recipe file under scripts/screenshots/ default-exports an async
// function `(ctx) => void` that drives the app into a scripted scene and
// writes PNGs under docs/screenshots/. `ctx` exposes `{ browser, seed,
// newPage, OUT, APP }` so recipes don't have to re-import the harness.

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const APP = process.env.SCREENSHOT_APP || 'http://localhost:3000';
const API = process.env.SCREENSHOT_API || 'http://localhost:3080';
const OUT = path.resolve(import.meta.dir, '..', 'docs', 'screenshots');
const RECIPES_DIR = path.resolve(import.meta.dir, 'screenshots');
const VIEWPORT = { width: 1280, height: 900 };
const GAME_ID = 1;

const seed = async (collection, value) => {
  const res = await fetch(`${API}/api/game/${GAME_ID}/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`seed ${collection} -> ${res.status}`);
};

const newPage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  return page;
};

const loadRecipe = async (name) => {
  const file = path.join(RECIPES_DIR, `${name}.mjs`);
  const mod = await import(file);
  if (typeof mod.default !== 'function') {
    throw new Error(`Recipe "${name}" must default-export an async function`);
  }
  return mod.default;
};

const listRecipes = async () => {
  const entries = await fs.readdir(RECIPES_DIR).catch(() => []);
  return entries.filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''));
};

const run = async () => {
  const arg = process.argv[2];
  if (!arg) {
    const names = await listRecipes();
    console.error(`Usage: screenshot.mjs <recipe|--all>\nAvailable: ${names.join(', ') || '(none)'}`);
    process.exit(1);
  }
  await fs.mkdir(OUT, { recursive: true });
  const names = arg === '--all' ? await listRecipes() : [arg];
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  try {
    for (const name of names) {
      const recipe = await loadRecipe(name);
      await recipe({ browser, seed, newPage, OUT, APP });
      console.log(`recipe "${name}" -> ${OUT}`);
    }
  } finally {
    await browser.close();
  }
};

await run();
