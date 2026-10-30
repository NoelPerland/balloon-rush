import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.argv[2] || 'http://127.0.0.1:8984/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Play', exact: true }).tap();
  const board = await page.locator('canvas').boundingBox();
  await page.touchscreen.tap(board.x + board.width * 555 / 1280, board.y + board.height * 180 / 720);
  assert.match(await page.locator('#hud').innerText(), /105/);
  assert.match(await page.locator('#hud').innerText(), /Dart upgrades/);
  await page.locator('[data-upgrade-path="rapid"]').tap();
  assert.equal(await page.locator('.upgrade-card.locked[disabled]').count(), 2);
  await page.getByRole('button', { name: 'Start Wave', exact: true }).tap();
  await page.getByRole('button', { name: 'Wave Live', exact: true }).waitFor();
  for (const [width, height] of [[390,844], [360,640], [844,390], [1366,768], [1920,1080]]) {
    await page.setViewportSize({ width, height });
    const fit = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    assert(fit.width <= width && fit.height <= height, `Overflow at ${width}x${height}`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: real touch tower purchase, upgrade lock, wave start, five viewport sizes and no page errors.');
} finally {
  await browser.close();
}
