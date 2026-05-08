import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

const executablePath = edge.find((path) => existsSync(path));

const smokeUrl = process.env.SMOKE_URL ?? 'http://127.0.0.1:5188';

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));
await page.goto(smokeUrl, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Play' }).click();
await page.locator('canvas').click({ position: { x: 555, y: 180 } });
await page.locator('[data-upgrade-path="rapid"]').click();
const lockedCards = await page.locator('.upgrade-card.locked[disabled]').count();
await page.getByRole('button', { name: /Start Wave/ }).click();
await page.locator('[data-tower="dart"]').click();
await page.locator('canvas').click({ position: { x: 900, y: 540 } });
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-game.png' });
const hud = await page.locator('#hud').innerText().catch(() => '');
const feed = await page.locator('#log').innerText().catch(() => '');
if (!hud.includes('1/20')) throw new Error(`Expected 20-wave HUD, got: ${hud}`);
if (lockedCards !== 2) throw new Error(`Expected two locked upgrade cards, got: ${lockedCards}`);
if (!hud.includes('$\n10')) throw new Error(`Expected mid-round tower buy to spend money, got: ${hud}`);
if (!feed.includes('Wave 1 started')) throw new Error(`Expected live pop log, got: ${feed}`);
console.log(JSON.stringify({
  title: await page.title(),
  logs,
  lockedCards,
  hud,
  feed,
  screen: await page.locator('#screen').innerText().catch(() => ''),
}, null, 2));
await browser.close();
