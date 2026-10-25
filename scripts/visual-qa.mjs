import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const port = Number(process.env.VISUAL_QA_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}/`;
const phaseArg = process.argv.find((argument) => argument.startsWith('--phase='));
const phase = phaseArg?.split('=')[1] || 'p0';
const onlyArg = process.argv.find((argument) => argument.startsWith('--only='));
const onlyScene = onlyArg?.split('=')[1];
const outputDir = path.resolve('qa', phase);
fs.mkdirSync(outputDir, { recursive: true });

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
  env: process.env
});
let browser;

async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Vite did not become available at ${baseUrl}`);
}

function calculateLuminance(buffer) {
  const { data, width, height } = PNG.sync.read(buffer);
  let dark = 0;
  let bright = 0;
  let centerSum = 0;
  let centerCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      if (lum < 0.03) dark += 1;
      if (lum > 0.9) bright += 1;
      if (x >= width * 0.2 && x < width * 0.8 && y >= height * 0.2 && y < height * 0.8) {
        centerSum += lum;
        centerCount += 1;
      }
      if (x < width * 0.1 || x >= width * 0.9 || y < height * 0.1 || y >= height * 0.9) {
        edgeSum += lum;
        edgeCount += 1;
      }
    }
  }
  const pixels = width * height;
  return {
    darkPercent: +(dark * 100 / pixels).toFixed(2),
    brightPercent: +(bright * 100 / pixels).toFixed(2),
    centerMean: +(centerSum / centerCount).toFixed(4),
    edgeMean: +(edgeSum / edgeCount).toFixed(4)
  };
}

async function waitForAssets(page) {
  await page.waitForFunction(() => document.querySelector('#asset-loading')?.classList.contains('asset-loading-done'), undefined, { timeout: 90000 });
}

async function assertNoDirectorZoneOverlaps(page, label) {
  const overlaps = await page.evaluate(() => {
    const entries = [...document.querySelectorAll('[data-ui-layer]:not(.ui-director-leaving)')].map((el) => {
      const rect = el.getBoundingClientRect();
      return { id: el.dataset.uiLayer, zone: el.dataset.uiZone, rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } };
    });
    const collisions = [];
    for (let i = 0; i < entries.length; i += 1) for (let j = i + 1; j < entries.length; j += 1) {
      if (entries[i].zone !== entries[j].zone) continue;
      const width = Math.max(0, Math.min(entries[i].rect.right, entries[j].rect.right) - Math.max(entries[i].rect.left, entries[j].rect.left));
      const height = Math.max(0, Math.min(entries[i].rect.bottom, entries[j].rect.bottom) - Math.max(entries[i].rect.top, entries[j].rect.top));
      if (width * height > 4) collisions.push(`${entries[i].id} / ${entries[j].id}`);
    }
    return collisions;
  });
  if (overlaps.length) throw new Error(`${label}: UI director zone overlaps: ${overlaps.join(', ')}`);
}

async function assertDirectorState(page, state) {
  const invalid = await page.evaluate((expected) => [...document.querySelectorAll('[data-ui-layer]:not(.ui-director-leaving)')]
    .filter((el) => {
      const layers = {
        LOADING: ['system'], INTRO: ['system', 'cinematic'], FLIGHT: ['action', 'cinematic'],
        ARRIVAL: ['cinematic', 'coach'], EXPLORE: ['hud', 'action', 'coach', 'toast', 'cinematic'],
        FOCUS: ['cinematic'], MEMORY: ['modal'], FINALE_ALIGN: ['cinematic'], FINALE_HEART: ['cinematic'],
        FINALE_CAKE: ['action', 'cinematic'], FINALE_LETTER: ['cinematic'], EPILOGUE: ['hud', 'action', 'toast']
      };
      const declaredStates = el.dataset.uiStates;
      return !layers[expected]?.includes(el.dataset.uiLayerType) || (declaredStates && !declaredStates.split(',').includes(expected));
    }).map((el) => `${el.dataset.uiLayer}:${el.dataset.uiLayerType} [${el.dataset.uiStates || 'all'}]`), state);
  if (invalid.length) throw new Error(`${state}: unauthorized UI director entries: ${invalid.join(', ')}`);
  await assertNoDirectorZoneOverlaps(page, state);
}

try {
  await ready();
  browser = await chromium.launch({
    channel: process.env.CHROME_CHANNEL || 'chrome',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader']
  });
  const errors = [];
  if (phase.startsWith('round3-') && onlyScene === 'flow-stress') {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`flow-stress: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`flow-stress: ${message.text()}`); });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); } } });
    });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=flow-stress`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE');
    await assertDirectorState(page, 'EXPLORE');
    await page.locator('.heart-dot[data-id="1"]').click();
    await page.locator('.heart-dot[data-id="2"]').click({ force: true });
    await page.locator('.heart-dot[data-id="3"]').click({ force: true });
    await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 15000 });
    await assertDirectorState(page, 'MEMORY');
    await page.setViewportSize({ width: 1180, height: 720 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE', undefined, { timeout: 10000 });
    await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
    const states = [];
    const order = [3, 1, 5, 4, 2];
    for (const id of order) {
      await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
      await page.locator(`.heart-dot[data-id="${id}"]`).click();
      console.log(`flow-stress: selected memory ${id}`);
      await page.waitForFunction(() => document.body.dataset.flowState === 'FOCUS', undefined, { timeout: 10000 });
      await assertDirectorState(page, 'FOCUS');
      states.push('FOCUS');
      await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 15000 });
      await page.waitForFunction(() => document.body.dataset.flowState === 'MEMORY', undefined, { timeout: 5000 });
      await assertDirectorState(page, 'MEMORY');
      states.push('MEMORY');
      await page.locator('#modal-back-btn').click();
      if (id !== order.at(-1)) {
        await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE', undefined, { timeout: 10000 });
        await assertDirectorState(page, 'EXPLORE');
        states.push('EXPLORE');
        await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
      }
    }
    await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_ALIGN', undefined, { timeout: 10000 });
    await assertDirectorState(page, 'FINALE_ALIGN');
    await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
    await page.screenshot({ path: path.join(outputDir, 's8-finale-align.png') });
    states.push('FINALE_ALIGN');
    await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_HEART', undefined, { timeout: 10000 });
    await page.waitForTimeout(1800);
    await assertDirectorState(page, 'FINALE_HEART');
    await page.screenshot({ path: path.join(outputDir, 's9-finale-heart.png') });
    states.push('FINALE_HEART');
    await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_CAKE', undefined, { timeout: 20000 });
    await assertDirectorState(page, 'FINALE_CAKE');
    states.push('FINALE_CAKE');
    for (const expected of ['FOCUS', 'MEMORY', 'EXPLORE', 'FINALE_ALIGN', 'FINALE_HEART', 'FINALE_CAKE']) if (!states.includes(expected)) throw new Error(`Flow path did not visit ${expected}: ${states.join(', ')}`);
    const mic = page.locator('.cake-mic-button');
    if (await mic.isVisible()) await mic.click();
    await page.waitForTimeout(150);
    await page.locator('.cake-blow-button').click();
    await page.waitForFunction(() => !document.querySelector('.cake-blow-button'), undefined, { timeout: 5000 });
    await page.screenshot({ path: path.join(outputDir, 's11-cake-exiting.png') });
    await page.waitForSelector('.ui-epilogue-actions', { timeout: 12000 });
    await assertDirectorState(page, 'EPILOGUE');
    if (await page.locator('.cake-blow-button').count()) throw new Error('Cake action remained after blowing out candles.');
    const resourceCounts = [];
    resourceCounts.push(await page.evaluate(() => window.__qaRendererInfo));
    await page.screenshot({ path: path.join(outputDir, 'flow-stress-epilogue.png') });
    for (let cycle = 1; cycle <= 5; cycle += 1) {
      await page.locator('.ui-epilogue-actions [data-action="cake"]').click();
      await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_CAKE', undefined, { timeout: 15000 });
      await page.locator('.cake-blow-button').click();
      await page.waitForSelector('.ui-epilogue-actions', { timeout: 12000 });
      if (await page.locator('.cake-blow-button').count()) throw new Error(`Cake action remained after repeat ${cycle}.`);
      resourceCounts.push(await page.evaluate(() => window.__qaRendererInfo));
    }
    const firstResources = resourceCounts[0];
    for (const [index, resources] of resourceCounts.entries()) {
      if (!resources || resources.geometries > firstResources.geometries + 1 || resources.textures > firstResources.textures + 1) {
        throw new Error(`Three.js resources grew after cake cycle ${index}: ${JSON.stringify(resourceCounts)}`);
      }
    }
    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'fx-off') {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`fx-off: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`fx-off: ${message.text()}`); });
    await page.goto(`${baseUrl}?skipintro=1&fx=off&mute=1&quality=low&qa=cake`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForSelector('.finale-letter-card.lite', { timeout: 10000 });
    await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_CAKE', undefined, { timeout: 5000 });
    await assertDirectorState(page, 'FINALE_CAKE');
    await assertNoDirectorZoneOverlaps(page, 'fx off finale');
    await page.screenshot({ path: path.join(outputDir, 'fx-off-finale.png') });
    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'memory-orders') {
    const orders = [[3, 1, 5, 4, 2], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [2, 4, 1, 5, 3], [4, 2, 5, 1, 3]];
    for (const [orderIndex, order] of orders.entries()) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
      page.on('pageerror', (error) => errors.push(`memory-orders-${orderIndex + 1}: ${error.message}`));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`memory-orders-${orderIndex + 1}: ${message.text()}`); });
      await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=flow-stress`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await waitForAssets(page);
      await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE');
      for (let index = 0; index < order.length; index += 1) {
        const id = order[index];
        await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
        await page.locator(`.heart-dot[data-id="${id}"]`).click();
        await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 15000 });
        await page.waitForFunction(() => document.body.dataset.flowState === 'MEMORY', undefined, { timeout: 10000 });
        await assertDirectorState(page, 'MEMORY');
        if (index < order.length - 1 && !await page.locator('#modal-back-btn').isVisible()) throw new Error(`Memory ${id} did not present its close action.`);
        await page.locator('#modal-back-btn').click();
        if (index < order.length - 1) {
          await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE', undefined, { timeout: 10000 });
          await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 });
        }
      }
      await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_CAKE', undefined, { timeout: 20000 });
      await assertDirectorState(page, 'FINALE_CAKE');
      console.log(`memory-orders: completed ${order.join(' → ')}`);
      await page.close();
    }
  } else if (phase.startsWith('round3-') && onlyScene === 'memory-stages') {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`memory-stages: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`memory-stages: ${message.text()}`); });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=modal-slide&qaMemory=2`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 20000 });
    for (const [step, wait] of [[1, 100], [2, 420], [3, 820], [4, 1250]]) {
      await page.waitForTimeout(wait);
      await page.screenshot({ path: path.join(outputDir, `s6-memory-step${step}.png`) });
    }
    await page.locator('#modal-back-btn').click();
    await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE');
    await page.waitForFunction(() => !window.__qaIsFlying).catch(() => {});
    await page.locator('.heart-dot[data-id="5"]').click();
    await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 20000 });
    await page.waitForTimeout(1700);
    await page.screenshot({ path: path.join(outputDir, 's6-memory-5-letter.png') });
    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'reduced-motion') {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`reduced-motion: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`reduced-motion: ${message.text()}`); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=arrival-caption`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.locator('.arrival-lower-third').waitFor({ state: 'visible', timeout: 10000 });
    const duration = await page.locator('.arrival-lower-third').evaluate((el) => getComputedStyle(el).animationDuration);
    if (!duration.includes('1e-05') && !duration.includes('0.00001') && !duration.includes('0s')) throw new Error(`Reduced motion did not collapse caption animation: ${duration}`);
    await page.screenshot({ path: path.join(outputDir, 'reduced-motion.png') });
    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'mobile-landscape') {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outputDir, 'mobile-landscape.png') });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    if (overflow) throw new Error('Mobile landscape layout overflows the viewport.');
    const overlaps = await page.evaluate(() => {
      const selectors = ['.hud-brand', '.hud-top-actions', '.guide-open-card-pill', '.hud-wish-wrap'];
      const visible = selectors.map((selector) => ({ selector, el: document.querySelector(selector) }))
        .filter(({ el }) => el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden')
        .map(({ selector, el }) => ({ selector, rect: el.getBoundingClientRect() }));
      const collisions = [];
      for (let i = 0; i < visible.length; i += 1) for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i].rect, b = visible[j].rect;
        if (Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 4) collisions.push(`${visible[i].selector} / ${visible[j].selector}`);
      }
      const actions = document.querySelector('.hud-top-actions').getBoundingClientRect();
      const brand = document.querySelector('.hud-brand').getBoundingClientRect();
      if (actions.left < brand.right - 4) collisions.push('.hud-brand / .hud-top-actions');
      return collisions;
    });
    if (overlaps.length) throw new Error(`Mobile landscape controls overlap: ${overlaps.join(', ')}`);
    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'mobile-tools') {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('pageerror', (error) => errors.push(`mobile-tools: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`mobile-tools: ${message.text()}`); });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(800);
    const toggle = page.locator('.mobile-tools-toggle');
    await toggle.waitFor({ state: 'visible' });
    if (await page.locator('.hud-wish-wrap').evaluate((el) => getComputedStyle(el).visibility) !== 'hidden') throw new Error('Mobile wish control should start collapsed.');
    await page.screenshot({ path: path.join(outputDir, 'mobile-tools-closed.png') });
    await toggle.click();
    if (await page.locator('.hud-wish-wrap').evaluate((el) => getComputedStyle(el).visibility) !== 'visible') throw new Error('Mobile wish control did not open from tools menu.');
    const collisions = await page.evaluate(() => {
      const items = ['.mobile-tools-toggle', '.hud-wish-wrap', '.tilt-mode-button', '.cinema-record-button']
        .map((selector) => document.querySelector(selector)).filter((el) => el && getComputedStyle(el).visibility === 'visible')
        .map((el) => ({ selector: el.className, rect: el.getBoundingClientRect().toJSON() }));
      const overlaps = [];
      for (let i = 0; i < items.length; i += 1) for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i].rect, b = items[j].rect;
        if (Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 4) overlaps.push(`${items[i].selector} / ${items[j].selector}`);
      }
      return overlaps;
    });
    if (collisions.length) throw new Error(`Mobile tools overlap: ${collisions.join(', ')}`);
    await page.screenshot({ path: path.join(outputDir, 'mobile-tools-open.png') });
    await page.close();
  } else if (phase === 'round2-R0' || (phase.startsWith('round3-') && onlyScene)) {
    const allScenes = [
      { file: 's0-loading.png', query: 'quality=low', early: true, wait: 0 },
      { file: 's1-intro.png', query: 'quality=low', wait: 0, intro: true },
      { file: 's2-flight-caption.png', query: 'quality=low', wait: 0, flight: true },
      { file: 'name-front.png', query: 'skipintro=1&quality=low&qa=name-front', wait: 2400 },
      { file: 'arrival-16.png', query: 'skipintro=1&quality=low&qa=arrival-16', wait: 900 },
      { file: 'arrival-caption.png', query: 'skipintro=1&quality=low&qa=arrival-caption', wait: 900 },
      { file: 's4-explore-beacons.png', query: 'skipintro=1&quality=low', wait: 1400 },
      ...[1, 2, 3, 4, 5].map((id) => ({ file: `focus-${String(id).padStart(2, '0')}.png`, query: `skipintro=1&quality=low&qa=focus-${id}`, wait: 900 })),
      { file: 'bulge-closeup.png', query: 'skipintro=1&quality=medium&qa=bulge-closeup', wait: 1200 },
      { file: 'arrival-constellation.png', query: 'skipintro=1&quality=low&qa=arrival-constellation', wait: 1200 },
      { file: 'final-heart.png', query: 'skipintro=1&quality=low&qa=final-heart', wait: 2400 },
      { file: 'signature-earth.png', query: 'skipintro=1&quality=medium&qa=signature-earth', wait: 1200 },
      { file: 'modal-slide.png', query: 'skipintro=1&quality=low&qa=modal-slide', wait: 4200 },
      { file: 'cinema-recorder.png', query: 'cinema=1&quality=low', wait: 1200, record: true },
      { file: 'cake.png', query: 'skipintro=1&quality=low&qa=cake', wait: 2600 },
      { file: 'orbit-visibility.png', query: 'quality=medium&skipintro=1', wait: 1800 }
    ];
    const scenes = onlyScene === 'focus-all'
      ? allScenes.filter((scene) => scene.file.startsWith('focus-'))
      : onlyScene ? allScenes.filter((scene) => scene.file === `${onlyScene}.png`) : allScenes;
    if (!scenes.length) throw new Error(`Unknown QA scene: ${onlyScene}`);
    for (const scene of scenes) {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (error) => errors.push(`${scene.file}: ${error.message}`));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`${scene.file}: ${message.text()}`); });
      if (scene.early) await page.route('**/textures/planets/**', async (route) => { await delay(1800); await route.continue(); });
      await page.goto(`${baseUrl}?mute=1&${scene.query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      if (scene.early) {
        await page.waitForFunction(() => document.querySelector('#asset-loading') && !document.querySelector('#asset-loading').classList.contains('asset-loading-done'), undefined, { timeout: 5000 });
        await page.screenshot({ path: path.join(outputDir, scene.file) });
        await page.close();
        console.log(`${scene.file} -> ${path.join(outputDir, scene.file)}`);
        continue;
      }
      await waitForAssets(page);
      if (scene.intro) {
        await page.locator('#intro-greeting-wrap:not(.hidden)').waitFor({ timeout: 12000 });
        await page.waitForTimeout(1300);
        console.log('intro QA state', await page.evaluate(() => ({ loading: document.querySelector('#asset-loading')?.className, intro: document.querySelector('#intro-screen')?.className, greeting: document.querySelector('#intro-greeting-wrap')?.className, text: document.querySelector('#intro-title')?.textContent })));
        await page.screenshot({ path: path.join(outputDir, scene.file) });
        await page.close();
        console.log(`${scene.file} -> ${path.join(outputDir, scene.file)}`);
        continue;
      }
      if (scene.flight) {
        await page.locator('#btn-enter-galaxy').click({ timeout: 12000 });
        await page.waitForFunction(() => document.body.dataset.flowState === 'FLIGHT', undefined, { timeout: 10000 });
        await page.locator('[data-ui-layer="flight-caption"]').waitFor({ state: 'visible', timeout: 5000 });
        await page.screenshot({ path: path.join(outputDir, scene.file) });
        await page.close();
        console.log(`${scene.file} -> ${path.join(outputDir, scene.file)}`);
        continue;
      }
      if (scene.file === 'arrival-16.png') await page.waitForFunction(() => window.__qaArrivalStage === 'number', undefined, { timeout: 10000 });
      if (scene.file === 'arrival-caption.png') {
        await page.waitForSelector('.arrival-lower-third', { timeout: 10000 });
        await page.waitForFunction(() => window.__qaArrivalNumber?.disposed, undefined, { timeout: 5000 });
      }
      if (scene.file === 'orbit-visibility.png') {
        await page.locator('#btn-toggle-galaxy').click();
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(scene.wait);
      if (scene.file === 'cake.png') console.log('cake secret-message QA', await page.evaluate(() => window.__qaCakeMessage));
      await page.screenshot({ path: path.join(outputDir, scene.file) });
      if (scene.record) {
        const recordButton = page.locator('.cinema-record-button');
        await recordButton.waitFor({ timeout: 5000 });
        const download = page.waitForEvent('download', { timeout: 10000 });
        await recordButton.click();
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(outputDir, 'cinema-recording.png') });
        await recordButton.click();
        const video = await download;
        if (!video.suggestedFilename().endsWith('.webm')) errors.push('cinema recorder: expected a WebM download');
      }
      if (scene.file === 'cake.png') {
        await page.locator('.cake-blow-button').click();
        await page.waitForFunction(() => !document.querySelector('.cake-blow-button'), undefined, { timeout: 5000 });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(outputDir, 'cake-blown.png') });
      }
      await page.close();
      console.log(`${scene.file} -> ${path.join(outputDir, scene.file)}`);
    }
    const responsiveScenes = onlyScene ? [] : [
      { name: 'portrait', viewport: { width: 1080, height: 1920 }, query: 'skipintro=1&ratio=9x16&quality=medium' },
      { name: 'mobile', viewport: { width: 390, height: 844 }, query: 'skipintro=1&quality=low', isMobile: true, hasTouch: true }
    ];
    for (const scene of responsiveScenes) {
      const page = await browser.newPage({
        viewport: scene.viewport,
        deviceScaleFactor: 1,
        isMobile: scene.isMobile || false,
        hasTouch: scene.hasTouch || false
      });
      page.on('pageerror', (error) => errors.push(`${scene.name}: ${error.message}`));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`${scene.name}: ${message.text()}`); });
      await page.goto(`${baseUrl}?mute=1&${scene.query}`, { waitUntil: 'domcontentloaded' });
      await waitForAssets(page);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(outputDir, `${scene.name}.png`) });
      await page.close();
      console.log(`${scene.name}.png -> ${path.join(outputDir, `${scene.name}.png`)}`);
    }
  } else for (const viewport of [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'portrait', width: 1080, height: 1920 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`${viewport.name}: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`${viewport.name}: ${message.text()}`); });
    if (viewport.name === 'mobile') {
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=medium`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.evaluate(() => {
      window.__qaFrameTimes = [];
      let previous = 0;
      const sample = (time) => {
        if (previous) window.__qaFrameTimes.push(time - previous);
        previous = time;
        if (window.__qaFrameTimes.length < 240) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.waitForTimeout(3000);
    const file = path.join(outputDir, `${viewport.name}.png`);
    const image = await page.screenshot({ path: file });
    const frameTimes = await page.evaluate(() => window.__qaFrameTimes || []);
    const averageMs = frameTimes.length ? frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length : null;
    console.log(`${viewport.name} ${viewport.width}x${viewport.height}`, {
      ...calculateLuminance(image),
      averageFps: averageMs ? +(1000 / averageMs).toFixed(1) : 'not available'
    }, `-> ${file}`);
    if (viewport.name === 'desktop') {
      await page.locator('#btn-toggle-galaxy').click();
      await page.waitForTimeout(2600);
      const galaxyImage = await page.screenshot({ path: path.join(outputDir, 'galaxy-desktop.png') });
      console.log('galaxy desktop', calculateLuminance(galaxyImage));

      // Walk all five memories to smoke-test planet labels, the finale letter,
      // rose and the rendered-canvas download path.
      for (let id = 1; id <= 5; id += 1) {
        await page.locator(`.heart-dot[data-id="${id}"]`).click();
        await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 30000 });
        const wishBoxVisible = await page.locator('#finale-wish-box').isVisible();
        if (wishBoxVisible !== (id === 5)) throw new Error(`Memory ${id}: finale wish visibility mismatch.`);
        if (id === 5) {
          await page.waitForFunction(() => document.querySelector('#wish-body')?.textContent?.length > 20, undefined, { timeout: 8000 });
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
          await page.locator('#modal-capture-btn').click();
          const download = await downloadPromise;
          if (download.suggestedFilename() !== 'happy-birthday-khaohom.png') throw new Error('Birthday screenshot download has an unexpected filename.');
          const capturePath = path.join(outputDir, 'birthday-smoke.png');
          await download.saveAs(capturePath);
          const captureMetrics = calculateLuminance(fs.readFileSync(capturePath));
          if (captureMetrics.centerMean < 0.008) throw new Error('Birthday screenshot appears black.');
          console.log('birthday screenshot', captureMetrics, `-> ${capturePath}`);
        }
        await page.locator('#modal-back-btn').click();
        await page.waitForFunction(() => document.querySelector('#memory-modal-backdrop')?.classList.contains('hidden'), undefined, { timeout: 8000 });
        await page.waitForTimeout(2600);
        if (id === 5) {
          await page.waitForFunction(() => document.body.dataset.flowState === 'FINALE_CAKE', undefined, { timeout: 30000 });
          await assertNoDirectorZoneOverlaps(page, 'finale cake');
          await page.screenshot({ path: path.join(outputDir, 'finale-cake.png') });
        }
      }

      await page.close();
      const openDetail = async (name, query, wait, action) => {
        const detailPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
        detailPage.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
        detailPage.on('console', (message) => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`); });
        await detailPage.goto(`${baseUrl}?mute=1&${query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await waitForAssets(detailPage);
        if (action) await action(detailPage);
        await detailPage.waitForTimeout(wait);
        await detailPage.screenshot({ path: path.join(outputDir, `${name}.png`) });
        await detailPage.close();
      };
      await openDetail('name-front', 'quality=low&qa=name-front', 2400);
      await openDetail('bulge-closeup', 'skipintro=1&quality=medium&qa=bulge-closeup', 1200);
      await openDetail('final-heart', 'skipintro=1&quality=low&qa=final-heart', 1600);
      await openDetail('focus-flight', 'skipintro=1&quality=low', 650, async (detailPage) => {
        await detailPage.locator('.heart-dot[data-id="2"]').click();
      });
      await openDetail('memory-card-stage', 'skipintro=1&quality=low', 1500, async (detailPage) => {
        await detailPage.locator('.heart-dot[data-id="2"]').click();
        await detailPage.waitForSelector('#memory-modal-backdrop.visible', { timeout: 30000 });
      });
      await openDetail('cake-lit', 'skipintro=1&quality=low&qa=cake', 1800);
      await openDetail('cake-blown', 'skipintro=1&quality=low&qa=cake', 1800, async (detailPage) => {
        await detailPage.locator('.cake-blow-button').click();
        await detailPage.waitForFunction(() => !document.querySelector('.cake-blow-button'), undefined, { timeout: 10000 });
        await detailPage.waitForSelector('.ui-epilogue-actions', { timeout: 10000 });
        await assertNoDirectorZoneOverlaps(detailPage, 'epilogue');
      });
      await openDetail('fx-off-finale', 'skipintro=1&fx=off&quality=low&qa=cake', 800, async (detailPage) => {
        await detailPage.waitForSelector('.finale-letter-card.lite', { timeout: 5000 });
        await assertNoDirectorZoneOverlaps(detailPage, 'fx off finale');
      });
      await openDetail('quality-low-final-rose', 'skipintro=1&quality=low', 1200, async (detailPage) => {
        await detailPage.locator('.heart-dot[data-id="5"]').click();
        await detailPage.waitForSelector('#memory-modal-backdrop.visible', { timeout: 30000 });
      });
    }
    await page.close();
  }
  if (errors.length) {
    console.error('Browser errors:', [...new Set(errors)].join('\n'));
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
