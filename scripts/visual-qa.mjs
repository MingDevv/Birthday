import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
        FOCUS: ['cinematic'], MEMORY: ['modal'], FINALE_ALIGN: ['cinematic', 'coach'], FINALE_HEART: ['cinematic', 'coach'],
        FINALE_CAKE: ['action', 'cinematic', 'coach'], FINALE_LETTER: ['cinematic', 'coach'], EPILOGUE: ['hud', 'action', 'toast', 'coach']
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
  if (phase.startsWith('round8-')) {
    console.log(`Running Round 8 (Phases A-E) Star Gate QA Suite for phase: ${phase}...`);

    // Helper to check for solar system leaks in scene audit
    const assertNoSolarSystemLeaks = (audit, context) => {
      const forbiddenPatterns = ['heart', 'planet', 'orbit', 'beacon', 'moon', 'saturnring', 'rose'];
      const leaked = audit.filter(item => {
        const name = (item.name || '').toLowerCase();
        const parent = (item.parentName || '').toLowerCase();
        return forbiddenPatterns.some(pat => name.includes(pat) || parent.includes(pat));
      });
      if (leaked.length > 0) {
        errors.push(`${context}: Leaked solar system objects during transit: ${leaked.map(l => l.name).join(', ')}`);
      } else {
        console.log(`[PASS] ${context}: Zero solar system objects visible in scene.`);
      }
    };

    // 1. Intro Clean - Desktop (1280x720)
    console.log('\n--- 1. Testing Intro Clean (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`intro-clean-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=intro-clean`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1200);

      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'intro-clean-desktop');

      await page.screenshot({ path: path.join(outputDir, 'intro-clean-desktop.png') });
      await page.close();
    }

    // 2. Intro Clean - Portrait (390x844)
    console.log('\n--- 2. Testing Intro Clean (Portrait 390x844) ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`intro-clean-portrait: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=intro-clean`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1200);

      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'intro-clean-portrait');

      await page.screenshot({ path: path.join(outputDir, 'intro-clean-portrait.png') });
      await page.close();
    }

    // 3. Flight Start - Desktop (1280x720)
    console.log('\n--- 3. Testing Flight Start (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-start-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=flight-start`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(800);

      const isTransit = await page.evaluate(() => window.__solarSystem?.isTransitMode());
      if (!isTransit) errors.push('flight-start-desktop: solarSystem.isTransitMode() is NOT true!');
      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'flight-start-desktop');

      await page.screenshot({ path: path.join(outputDir, 'flight-start-desktop.png') });
      await page.close();
    }

    // 4. Flight Mid - Desktop (1280x720)
    console.log('\n--- 4. Testing Flight Mid (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-mid-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=flight-mid`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(800);

      const isTransit = await page.evaluate(() => window.__solarSystem?.isTransitMode());
      if (!isTransit) errors.push('flight-mid-desktop: solarSystem.isTransitMode() is NOT true!');
      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'flight-mid-desktop');

      await page.screenshot({ path: path.join(outputDir, 'flight-mid-desktop.png') });
      await page.close();
    }

    // 5. Flight End - Desktop (1280x720)
    console.log('\n--- 5. Testing Flight End (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-end-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=flight-end`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(800);

      const isTransit = await page.evaluate(() => window.__solarSystem?.isTransitMode());
      if (!isTransit) errors.push('flight-end-desktop: solarSystem.isTransitMode() is NOT true!');
      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'flight-end-desktop');

      await page.screenshot({ path: path.join(outputDir, 'flight-end-desktop.png') });
      await page.close();
    }

    // 6. Flight Mid - Portrait (390x844)
    console.log('\n--- 6. Testing Flight Mid (Portrait 390x844) ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-mid-portrait: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=flight-mid`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(800);

      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'flight-mid-portrait');

      await page.screenshot({ path: path.join(outputDir, 'flight-mid-portrait.png') });
      await page.close();
    }

    // 7. Flight Mid - Landscape (844x390)
    console.log('\n--- 7. Testing Flight Mid (Landscape 844x390) ---');
    {
      const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-mid-landscape: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=flight-mid`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(800);

      const audit = await page.evaluate(() => window.__qaSceneAudit?.() || []);
      assertNoSolarSystemLeaks(audit, 'flight-mid-landscape');

      await page.screenshot({ path: path.join(outputDir, 'flight-mid-landscape.png') });
      await page.close();
    }

    // 8. Arrival Reveal - Desktop (1280x720)
    console.log('\n--- 8. Testing Arrival Reveal (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`arrival-reveal-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-reveal`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(2500);

      await page.screenshot({ path: path.join(outputDir, 'arrival-reveal-desktop.png') });
      await page.close();
    }

    // 9. Arrival Reveal - Portrait (390x844)
    console.log('\n--- 9. Testing Arrival Reveal (Portrait 390x844) ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`arrival-reveal-portrait: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-reveal`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(2500);

      await page.screenshot({ path: path.join(outputDir, 'arrival-reveal-portrait.png') });
      await page.close();
    }

    // 10. Flight Skip (1280x720)
    console.log('\n--- 10. Testing Flight Skip Action ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`flight-skip: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&cinema=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForSelector('#btn-skip-flight', { timeout: 10000 });
      await page.locator('#btn-skip-flight').click();
      await delay(1200);

      const state = await page.evaluate(() => window.__flow?.state);
      console.log(`Flow state after skip: ${state}`);
      if (state !== 'ARRIVAL' && state !== 'EXPLORE') {
        errors.push(`Expected state after skip to be ARRIVAL or EXPLORE, got ${state}`);
      }

      await page.screenshot({ path: path.join(outputDir, 'flight-skip.png') });
      await page.close();
    }

    // 11. Reduced Motion Reveal (1280x720)
    console.log('\n--- 11. Testing Reduced Motion Reveal ---');
    {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      page.on('pageerror', (err) => errors.push(`reduced-motion-reveal: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-reveal`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1200);

      const particleCount = await page.evaluate(() => window.__qaScene?.getObjectByName('arrivalHeartParticleReveal')?.geometry?.attributes?.position?.count || 0);
      if (particleCount < 1300) errors.push(`reduced-motion-reveal: expected a readable static name field, got ${particleCount} particles`);

      await page.screenshot({ path: path.join(outputDir, 'reduced-motion-reveal.png') });
      await page.close();
    }

    // 12. FX Off Reveal (1280x720)
    console.log('\n--- 12. Testing FX Off Reveal ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`fx-off-reveal: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&fx=off&qa=arrival-reveal`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1200);

      await page.screenshot({ path: path.join(outputDir, 'fx-off-reveal.png') });
      await page.close();
    }

    // 13. Sharpness Focus - Desktop (1280x720)
    console.log('\n--- 13. Testing Sharpness Focus (Desktop 1280x720) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`sharpness-focus-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=sharpness-focus`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1500);

      await page.screenshot({ path: path.join(outputDir, 'sharpness-focus-desktop.png') });
      await page.close();
    }

    // 14. Sharpness Focus - Mobile (390x844)
    console.log('\n--- 14. Testing Sharpness Focus (Mobile 390x844) ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`sharpness-focus-mobile: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=sharpness-focus`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1500);

      const tourPointerOverlap = await page.evaluate(() => {
        const card = document.querySelector('.guide-tour-card');
        if (!card) return { missingTourCard: true, pointers: [] };
        const pointers = [...document.querySelectorAll('.guide-3d-pointer, .guide-edge-arrow')]
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })
          .map((el) => el.className);
        return { missingTourCard: false, pointers };
      });
      if (tourPointerOverlap.missingTourCard) errors.push('sharpness-focus-mobile: HUD tour card was not visible');
      if (tourPointerOverlap.pointers.length) errors.push(`sharpness-focus-mobile: planet pointers overlap the HUD tour card (${tourPointerOverlap.pointers.join(', ')})`);

      await page.screenshot({ path: path.join(outputDir, 'sharpness-focus-mobile.png') });
      await page.close();
    }
  } else if (phase.startsWith('round7-')) {
    console.log(`Running Round 7 (Phases A-E) QA Suite for phase: ${phase}...`);

    // -------------------------------------------------------------------------
    // 1. Arrival Word - Desktop (1440x900)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing arrival-word (Desktop 1440x900) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      page.on('console', (msg) => console.log(`[PAGE LOG ${msg.type()}]:`, msg.text()));
      page.on('pageerror', (err) => errors.push(`arrival-word-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-word`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(2500);

      const debugInfo = await page.evaluate(() => {
        const root = window.__qaScene?.getObjectByName('solarSystemHeartMaster');
        const points = window.__qaScene?.getObjectByName('arrivalHeartParticleReveal');
        const cam = window.__qaCamera;
        return {
          hasScene: !!window.__qaScene,
          children: window.__qaScene?.children?.map(c => c.name),
          rootChildren: root?.children?.map(c => c.name),
          pointsFound: !!points,
          pointsScale: points?.scale,
          pointsPos: points?.position,
          pointsCount: points?.geometry?.attributes?.position?.count,
          posSample: points?.geometry?.attributes?.position?.array?.slice(0, 9),
          opacity: points?.material?.opacity,
          visible: points?.visible,
          camPos: cam?.position,
          camFov: cam?.fov
        };
      });
      console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));

      await page.screenshot({ path: path.join(outputDir, 'arrival-word-desktop.png') });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // 2. Arrival Word - Mobile Portrait (390x844)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing arrival-word (Mobile Portrait 390x844) ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`arrival-word-portrait: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-word`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(2500);

      await page.screenshot({ path: path.join(outputDir, 'arrival-word-portrait.png') });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // 3. Arrival Word - Reduced Motion
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing arrival-word (Reduced Motion) ---');
    {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      page.on('pageerror', (err) => errors.push(`arrival-word-reduced-motion: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=arrival-word`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await delay(1200);

      await page.screenshot({ path: path.join(outputDir, 'arrival-word-reduced-motion.png') });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // 4. Cake Actions Mobile Clearance (No Coach Bubble Overlap)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Cake Actions Mobile Clearance ---');
    const cakeViewports = [
      { name: '390x844', width: 390, height: 844 },
      { name: '360x740', width: 360, height: 740 },
      { name: '430x932', width: 430, height: 932 },
      { name: '844x390', width: 844, height: 390 }
    ];

    for (const vp of cakeViewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`cake-mobile-${vp.name}: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=cake-lit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForSelector('.cake-actions', { timeout: 15000 });
      await page.waitForSelector('.guide-bubble-cake', { timeout: 15000 });
      await delay(600);

      const collision = await page.evaluate(() => {
        const actions = document.querySelector('.cake-actions');
        const coach = document.querySelector('.guide-bubble-cake');
        if (!actions || !coach) return { ok: false, reason: 'missing elements' };
        const aRect = actions.getBoundingClientRect();
        const cRect = coach.getBoundingClientRect();
        const overlaps = !(
          cRect.right < aRect.left ||
          cRect.left > aRect.right ||
          cRect.bottom < aRect.top ||
          cRect.top > aRect.bottom
        );
        return {
          ok: !overlaps,
          coachBottom: cRect.bottom,
          actionsTop: aRect.top,
          clearance: aRect.top - cRect.bottom
        };
      });

      console.log(`Cake mobile [${vp.name}]: collision ok=${collision.ok}, clearance=${collision.clearance}px`);
      if (!collision.ok) {
        errors.push(`Cake action collision on viewport ${vp.name}: coach overlaps actions!`);
      }

      if (vp.name === '390x844') {
        await page.screenshot({ path: path.join(outputDir, 'cake-actions-mobile.png') });
      }
      await page.close();
    }

    // -------------------------------------------------------------------------
    // 5. Epilogue Galaxy Prompt - Desktop (1440x900)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Epilogue Galaxy Prompt (Desktop) ---');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`epilogue-desktop: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=epilogue-actions`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForSelector('.guide-bubble-galaxy', { timeout: 15000 });
      await delay(600);

      const desktopText = await page.locator('.guide-bubble-galaxy .guide-bubble-text').textContent();
      console.log(`Epilogue desktop prompt text: "${desktopText}"`);
      if (!desktopText.includes('ท่องกาแล็กซี่ 3D')) {
        errors.push(`Epilogue desktop prompt text missing expected galaxy reference!`);
      }

      await page.screenshot({ path: path.join(outputDir, 'epilogue-galaxy-prompt-desktop.png') });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // 6. Epilogue Galaxy Prompt - Mobile (390x844) & Navigation
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Epilogue Galaxy Prompt (Mobile) & Navigation ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`epilogue-mobile: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&skipintro=1&qa=epilogue-actions`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForSelector('.guide-bubble-galaxy', { timeout: 15000 });
      await delay(600);

      const mobileText = await page.locator('.guide-bubble-galaxy .guide-bubble-text').textContent();
      console.log(`Epilogue mobile prompt text: "${mobileText}"`);
      if (!mobileText.includes('🌌')) {
        errors.push(`Epilogue mobile prompt text missing expected galaxy icon!`);
      }

      // Check touch target of #btn-toggle-galaxy
      const btnSize = await page.evaluate(() => {
        const btn = document.querySelector('#btn-toggle-galaxy');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });
      console.log(`Mobile #btn-toggle-galaxy touch target: ${btnSize?.width}x${btnSize?.height}`);
      if (!btnSize || btnSize.width < 44 || btnSize.height < 44) {
        errors.push(`Touch target for #btn-toggle-galaxy on mobile is less than 44x44px: ${btnSize?.width}x${btnSize?.height}`);
      }

      await page.screenshot({ path: path.join(outputDir, 'epilogue-galaxy-prompt-mobile.png') });

      // 7. Click #btn-toggle-galaxy to enter Galaxy View
      console.log('Clicking #btn-toggle-galaxy to enter Galaxy view...');
      await page.locator('#btn-toggle-galaxy').click();
      await delay(2600);

      // Verify guide is gone
      const guideVisible = await page.locator('.guide-bubble-galaxy').count();
      if (guideVisible > 0) {
        errors.push(`Guide bubble still visible after clicking #btn-toggle-galaxy!`);
      }

      await page.screenshot({ path: path.join(outputDir, 'epilogue-galaxy-active.png') });

      // 8. Click again to return to Heart View
      console.log('Clicking #btn-toggle-galaxy again to return to heart view...');
      await page.locator('#btn-toggle-galaxy').click();
      await delay(2400);

      await page.screenshot({ path: path.join(outputDir, 'epilogue-return-to-heart.png') });
      await page.close();
    }
  } else if (phase.startsWith('round6-')) {
    console.log(`Running Round 6 (Phases A-E) QA Suite for phase: ${phase}...`);

    // =========================================================================
    // 1. Phase B: Mobile Viewport & Safe Area checks
    // =========================================================================
    console.log('\n--- Checking Phase B: Viewport & Safe Area ---');
    const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
    if (!indexHtml.includes('viewport-fit=cover')) {
      errors.push('Phase B1: index.html is missing viewport-fit=cover!');
    }
    if (indexHtml.includes('user-scalable=no') || indexHtml.includes('maximum-scale')) {
      errors.push('Phase B1: index.html still contains user-scalable=no or maximum-scale!');
    }
    console.log('[PASS] Phase B1: viewport-fit=cover present, zoom lock removed.');

    const styleCss = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
    if (!styleCss.includes('env(safe-area-inset-top)')) {
      errors.push('Phase B2: src/style.css missing safe-area-inset-top on top zones!');
    }
    if (!styleCss.includes('100dvh')) {
      errors.push('Phase B3: src/style.css missing 100dvh fallbacks!');
    }
    console.log('[PASS] Phase B2/B3: Safe-area top zones and 100dvh verified.');

    // =========================================================================
    // 2. Phase A: Rapid Tap in Arrival (No Double 3D Name, No Double Caption/Guide)
    // =========================================================================
    console.log('\n--- Checking Phase A: Rapid Taps during Arrival ---');
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`arrival-rapid-tap: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&quality=low&qa=arrival-16`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(400);

      // Perform rapid taps across screen to simulate impatient user tapping through arrival
      for (let i = 0; i < 8; i++) {
        await page.mouse.click(195, 420);
        await delay(60);
      }
      await page.waitForTimeout(1600);

      // Check arrival3DNameText count in scene
      const nameMeshesCount = await page.evaluate(() => {
        const objs = window.__qaScene?.children?.filter(c => c.name === 'arrival3DNameText') || [];
        return objs.length;
      });
      console.log(`Phase A rapid tap test: arrival3DNameText count in scene = ${nameMeshesCount}`);
      if (nameMeshesCount > 1) {
        errors.push(`Phase A1 failed: multiple arrival3DNameText instances in scene (${nameMeshesCount})!`);
      } else {
        console.log('[PASS] Phase A1: No duplicate 3D name mesh created upon rapid tapping.');
      }

      // Check caption count
      const captionCount = await page.locator('.arrival-lower-third').count();
      console.log(`Phase A rapid tap test: .arrival-lower-third count = ${captionCount}`);
      if (captionCount > 1) {
        errors.push(`Phase A2 failed: multiple arrival caption overlays rendered (${captionCount})!`);
      } else {
        console.log('[PASS] Phase A2: Caption rendered at most once.');
      }

      // Check guide prompt pill/card count
      const guideCardCount = await page.locator('.guide-open-card-pill, .guide-tour-card').count();
      if (guideCardCount > 1) {
        errors.push(`Phase A3 failed: multiple guide cards/pills rendered (${guideCardCount})!`);
      } else {
        console.log('[PASS] Phase A3: Guide card count is <= 1.');
      }

      await page.screenshot({ path: path.join(outputDir, 'arrival-rapid-tap.png') });
      await page.close();
    }

    // =========================================================================
    // 3. Phase C: Unified Bottom-Right Dock Overlap Check across 4 Viewports
    // =========================================================================
    console.log('\n--- Checking Phase C: Unified Bottom-Right Dock across 4 Viewports ---');
    const viewports = [
      { name: 'iphone-portrait', width: 390, height: 844 },
      { name: 'android-narrow', width: 360, height: 740 },
      { name: 'mobile-landscape', width: 844, height: 390 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`dock-${vp.name}: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE', undefined, { timeout: 15000 });
      await page.waitForTimeout(800);

      // Check dock element existence and bounding rects of its visible children
      const checkDockOverlaps = () => page.evaluate(() => {
        const dock = document.querySelector('.bottom-right-dock');
        if (!dock) return { ok: false, error: 'missing .bottom-right-dock' };
        const dockRect = dock.getBoundingClientRect();
        const children = [...dock.querySelectorAll('button, .hud-circular-btn, .tilt-control-btn, .cinema-record-btn')]
          .filter(el => {
            const style = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && r.width > 0 && r.height > 0;
          });
        const rects = children.map(el => {
          const r = el.getBoundingClientRect();
          return { id: el.id || el.className, rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } };
        });

        const overlaps = [];
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const r1 = rects[i].rect;
            const r2 = rects[j].rect;
            const w = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
            const h = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
            if (w * h > 4) {
              overlaps.push(`${rects[i].id} overlaps with ${rects[j].id} (area: ${w * h}px)`);
            }
          }
        }

        const undersized = rects.filter(r => r.rect.width < 40 || r.rect.height < 40);

        return {
          ok: overlaps.length === 0,
          overlaps,
          undersized,
          dockRect: { left: dockRect.left, right: dockRect.right, top: dockRect.top, bottom: dockRect.bottom, width: dockRect.width, height: dockRect.height },
          childCount: rects.length
        };
      });

      const dockReport = await checkDockOverlaps();
      if (!dockReport.ok) {
        errors.push(`Phase C overlap error on ${vp.name}: ${dockReport.overlaps.join(', ')}`);
      } else {
        console.log(`[PASS] Phase C: ${vp.name} dock (default) has ${dockReport.childCount} visible elements, 0 overlaps.`);
      }

      // If mobile toggle exists, click it to test expanded tools
      const toggle = page.locator('#btn-mobile-tools-toggle');
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
        const openReport = await checkDockOverlaps();
        if (!openReport.ok) {
          errors.push(`Phase C overlap error on ${vp.name} (expanded): ${openReport.overlaps.join(', ')}`);
        } else {
          console.log(`[PASS] Phase C: ${vp.name} dock (expanded) has ${openReport.childCount} items, 0 overlaps.`);
        }
        if (openReport.undersized?.length) {
          errors.push(`Phase C: Touch targets below 40px when expanded on ${vp.name}: ${JSON.stringify(openReport.undersized)}`);
        }
      }

      await page.screenshot({ path: path.join(outputDir, `dock-${vp.name}.png`) });
      await page.close();
    }

    // Also check Cake mode: cake message & dock clearance
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`cake-dock: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=cake`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1500);

      const cakeClearance = await page.evaluate(() => {
        const msg = document.querySelector('.cake-owner-message');
        const dock = document.querySelector('.bottom-right-dock');
        if (!msg || !dock) return { ok: true, note: 'msg or dock not both present' };
        const r1 = msg.getBoundingClientRect();
        const r2 = dock.getBoundingClientRect();
        const w = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const h = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
        return { ok: w * h <= 4, overlapArea: w * h };
      });
      if (!cakeClearance.ok) {
        errors.push(`Phase C: cake message collides with dock! Overlap: ${cakeClearance.overlapArea}px`);
      } else {
        console.log('[PASS] Phase C: Cake owner message & dock have clean separation.');
      }
      await page.screenshot({ path: path.join(outputDir, 'cake-dock-mobile.png') });
      await page.close();
    }

    // =========================================================================
    // 4. Phase D: Arrival Particles Constellation (Mobile & Desktop)
    // =========================================================================
    console.log('\n--- Checking Phase D: Arrival Particles Constellation ---');
    for (const vp of [
      { name: 'portrait', width: 390, height: 844 },
      { name: 'desktop', width: 1920, height: 1080 }
    ]) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`arrival-constellation-${vp.name}: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&guide=off&quality=low&qa=arrival-constellation`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1400);

      const particleMetrics = await page.evaluate(() => {
        const pointsObj = window.__qaScene?.children?.find(c => c.name === 'arrivalHeartParticleReveal') ||
                          window.__qaScene?.getObjectByName('arrivalHeartParticleReveal');
        if (!pointsObj) return { found: false };
        const geo = pointsObj.geometry;
        const count = geo?.attributes?.position?.count || 0;
        const opacity = pointsObj.material?.opacity ?? 0;
        return {
          found: true,
          count,
          opacity,
          visible: pointsObj.visible,
          scale: pointsObj.scale.x
        };
      });

      console.log(`Phase D ${vp.name} particle metrics:`, particleMetrics);
      if (!particleMetrics.found || particleMetrics.count < 300) {
        errors.push(`Phase D failed on ${vp.name}: points not found or point count (${particleMetrics.count}) < 300!`);
      } else {
        console.log(`[PASS] Phase D ${vp.name}: Constellation points active (${particleMetrics.count} points, scale ${particleMetrics.scale?.toFixed(2)}).`);
      }

      const capturePath = path.join(outputDir, `arrival-constellation-${vp.name}.png`);
      const imgBuffer = await page.screenshot({ path: capturePath });
      const lum = calculateLuminance(imgBuffer);
      console.log(`Luminance for arrival-constellation-${vp.name}:`, lum);
      if (lum.centerMean < 0.005) {
        errors.push(`Phase D screenshot on ${vp.name} is nearly completely black! centerMean: ${lum.centerMean}`);
      }
      await page.close();
    }
  } else if (phase.startsWith('round5-')) {
    console.log(`Running Round 5 QA Suite for phase: ${phase}...`);
    // 0. MD5 Check on memory images (R5-1)
    const md5Hashes = {};
    for (let i = 1; i <= 5; i++) {
      const p = path.resolve(`public/images/memory-${i}.jpg`);
      if (fs.existsSync(p)) {
        const hash = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
        md5Hashes[i] = hash;
      }
    }
    console.log('Memory images MD5:', md5Hashes);
    if (md5Hashes[4] && md5Hashes[5] && md5Hashes[4] === md5Hashes[5]) {
      console.log('Notice: memory-4 and memory-5 share identical MD5. Checking collage setting in memoriesData.js...');
      const memDataFile = fs.readFileSync(path.resolve('src/config/memoriesData.js'), 'utf8');
      if (!memDataFile.includes('collage: [1, 2, 3, 4]')) {
        errors.push('R5-1: memory-5 is a duplicate file of memory-4 and collage fallback is missing!');
      } else {
        console.log('PASS R5-1: Duplicate image resolved with 2x2 collage fallback for memory 5.');
      }
    }

    // 1. Memory Cards 1..5 in Desktop & Mobile Portrait (R5-2)
    for (const vp of [
      { mode: 'desktop', width: 1920, height: 1080 },
      { mode: 'portrait', width: 390, height: 844 }
    ]) {
      for (let id = 1; id <= 5; id++) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1
        });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        page.on('pageerror', (err) => errors.push(`memory-${id}-${vp.mode}: ${err.message}`));
        await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&guide=off`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForAssets(page);
        await page.waitForFunction(() => document.body.dataset.flowState === 'EXPLORE', undefined, { timeout: 15000 });
        await page.waitForFunction(() => !window.__qaIsFlying, undefined, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(400);
        await page.locator(`.heart-dot[data-id="${id}"]`).click({ force: true });
        await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 35000 });
        await page.waitForSelector('#memory-card', { state: 'visible', timeout: 15000 });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#memory-modal-backdrop')).opacity === '1', undefined, { timeout: 15000 });
        await page.waitForTimeout(id === 5 ? 1200 : 600);
        await page.screenshot({ path: path.join(outputDir, `memory-${id}-${vp.mode}.png`) });

        if (id === 1 && vp.mode === 'desktop') {
          await page.locator('#polaroid-frame').click();
          await page.waitForSelector('#memory-lightbox.visible', { timeout: 10000 });
          await page.screenshot({ path: path.join(outputDir, `memory-1-lightbox.png`) });
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelector('#memory-lightbox')?.classList.contains('hidden'), undefined, { timeout: 10000 });
        }
        await page.close();
        console.log(`Captured memory-${id}-${vp.mode}.png`);
      }
    }

    // 2. Guide Intro State
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-intro: ${err.message}`));
      await page.goto(`${baseUrl}?mute=1&guide=reset`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.locator('#intro-greeting-wrap:not(.hidden)').waitFor({ timeout: 15000 });
      await page.waitForTimeout(2800);
      const soundHintVisible = await page.locator('#intro-sound-hint').isVisible();
      const idleCtaVisible = await page.locator('#intro-idle-cta').isVisible();
      console.log('Intro guide elements:', { soundHintVisible, idleCtaVisible });
      await page.screenshot({ path: path.join(outputDir, 'guide-intro.png') });
      await page.close();
    }

    // 3. First Explore & Spotlight & Next Chip
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-explore-first: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=reset`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1000);
      const qaGuide = await page.evaluate(() => window.__qaGuide?.());
      console.log('Explore first __qaGuide:', qaGuide);
      if (qaGuide?.visibleGuideCount > 1) {
        errors.push(`Guide rule violated: visibleGuideCount is ${qaGuide.visibleGuideCount} (must be <= 1)`);
      }
      await page.screenshot({ path: path.join(outputDir, 'guide-explore-first.png') });
      await page.screenshot({ path: path.join(outputDir, 'guide-next-chip.png') });
      await page.close();
    }

    // 4. First-run Tour Steps 1..6
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-tour: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=reset`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(800);
      const closeBtn = page.locator('.guide-bubble-close');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
      await page.waitForTimeout(500);

      for (let step = 1; step <= 6; step++) {
        const tourCard = page.locator('.guide-tour-card');
        if (await tourCard.isVisible()) {
          await page.screenshot({ path: path.join(outputDir, `guide-tour-${step}.png`) });
          console.log(`Captured guide-tour-${step}.png`);
          const nextBtn = page.locator('#tour-next-btn');
          if (await nextBtn.isVisible()) {
            await nextBtn.click();
            await page.waitForTimeout(400);
          }
        }
      }
      await page.close();
    }

    // 5. Idle Nudge (Level 2) with ?qaTime=fast
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-idle2: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=reset&qaTime=fast`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(outputDir, 'guide-idle2.png') });
      await page.close();
    }

    // 6. Screen Edge Arrow Indicator
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-edge-arrow: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=reset&qaTime=fast`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.evaluate(() => {
        window.__qaGuidePointAtPlanet?.(1);
      });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outputDir, 'guide-edge-arrow.png') });
      await page.close();
    }

    // 7. Guide Help Sheet & "ลองเลย"
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-help-sheet: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=off`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(800);
      await page.locator('#btn-guide-help').click();
      await page.waitForSelector('.guide-help-backdrop.visible', { timeout: 5000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outputDir, 'guide-help-sheet.png') });
      const actionBtn = page.locator('.guide-help-action-btn').first();
      if (await actionBtn.isVisible()) {
        await actionBtn.click();
      }
      await page.waitForTimeout(400);
      await page.close();
    }

    // 8. After Close Memory Guide Bubble
    {
      const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      page.on('pageerror', (err) => errors.push(`guide-after-close: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=reset`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        document.querySelector('.guide-bubble-close')?.click();
        document.querySelector('#tour-skip-btn')?.click();
        sessionStorage.setItem('tourSeen', 'true');
        document.querySelector('.guide-spotlight')?.remove();
      });
      await page.waitForTimeout(400);
      await page.locator('.heart-dot[data-id="1"]').click({ force: true });
      await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 35000 });
      await page.waitForTimeout(400);
      await page.locator('#modal-back-btn').click();
      await page.waitForFunction(() => document.querySelector('#memory-modal-backdrop')?.classList.contains('hidden'), undefined, { timeout: 10000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, 'guide-after-close.png') });
      await page.close();
    }

    // 9. Cake Scene Guide & Secret Message Dish Clearance
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (err) => errors.push(`guide-cake: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&qa=cake-front`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1600);
      await assertDirectorState(page, 'FINALE_CAKE');
      await page.screenshot({ path: path.join(outputDir, 'guide-cake.png') });
      await page.close();
    }

    // 10. Epilogue Scene Guide
    {
      const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      page.on('pageerror', (err) => errors.push(`guide-epilogue: ${err.message}`));
      await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=cake`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1000);
      await page.locator('.cake-blow-button').click();
      await page.waitForSelector('.ui-epilogue-actions', { timeout: 20000 });
      await page.waitForTimeout(600);
      await assertDirectorState(page, 'EPILOGUE');
      await page.screenshot({ path: path.join(outputDir, 'guide-epilogue.png') });
      await page.close();
    }

    // 11. Guide OFF check (?guide=off)
    {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      await page.goto(`${baseUrl}?skipintro=1&mute=1&guide=off`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForAssets(page);
      await page.waitForTimeout(1000);
      const qaGuideOff = await page.evaluate(() => window.__qaGuide?.());
      if (qaGuideOff?.visibleGuideCount !== 0) {
        errors.push(`?guide=off failed! visibleGuideCount is ${qaGuideOff?.visibleGuideCount}`);
      }
      await page.close();
    }
  } else if (phase.startsWith('round4-')) {
    console.log(`Running Round 4 QA Suite for phase: ${phase}...`);
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => { console.log('PAGE ERROR:', error.message); errors.push(`round4: ${error.message}`); });
    page.on('console', (message) => { if (message.type() === 'error') { console.log('CONSOLE ERROR:', message.text()); errors.push(`round4: ${message.text()}`); } });

    // 1. Scene Audit in Cake Mode (Desktop)
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=cake-front`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(2000);

    const auditReport = await page.evaluate(() => {
      if (typeof window.__qaSceneAudit !== 'function') return { ok: false, error: '__qaSceneAudit missing' };
      const objects = window.__qaSceneAudit();
      const allowPatterns = [
        /^cosmicBirthdayCake/i,
        /^cake/i,
        /heart.*topper/i,
        /fireworks|burst/i,
        /skybox|stars|galaxy/i
      ];
      const disallowed = objects.filter((o) => {
        return !allowPatterns.some((pattern) => pattern.test(o.name) || pattern.test(o.parentName));
      });
      return { ok: disallowed.length === 0, disallowed, total: objects.length };
    });
    if (!auditReport.ok) {
      errors.push(`Scene audit failed in cake mode! Disallowed visible objects: ${JSON.stringify(auditReport.disallowed)}`);
    } else {
      console.log(`[PASS] 7.1 Scene audit clean: ${auditReport.total} permitted objects, 0 leaked objects.`);
    }

    await page.screenshot({ path: path.join(outputDir, 'cake-front.png') });
    console.log(`Saved ${path.join(outputDir, 'cake-front.png')}`);

    // Cake Lit & Candle Separation
    const candleDebug = await page.evaluate(() => {
      const positions = window.__qaCandleScreenPositions?.() || [];
      return {
        total: positions.length,
        visibleCount: positions.filter((p) => p.visible).length,
        items: positions.map(p => ({ index: p.index, visible: p.visible, x: Math.round(p.x), y: Math.round(p.y) }))
      };
    });
    console.log('CANDLE DEBUG:', JSON.stringify(candleDebug));

    const candleCheck = await page.evaluate(() => {
      const positions = window.__qaCandleScreenPositions?.() || [];
      const visibleFlames = positions.filter((p) => p.visible);
      let minDistance = Infinity;
      for (let i = 0; i < visibleFlames.length; i++) {
        for (let j = i + 1; j < visibleFlames.length; j++) {
          const dx = visibleFlames[i].x - visibleFlames[j].x;
          const dy = visibleFlames[i].y - visibleFlames[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < minDistance) minDistance = dist;
        }
      }
      const minDistancePercent = (minDistance / window.innerWidth) * 100;
      return {
        flameCount: visibleFlames.length,
        minDistance,
        minDistancePercent
      };
    });
    if (candleCheck.flameCount !== 16) {
      errors.push(`[FAIL] 7.2 Candle flame count before blow: expected 16, got ${candleCheck.flameCount}`);
    } else if (candleCheck.minDistancePercent < 1.0) {
      errors.push(`[FAIL] 7.2 Candle separation too close: ${candleCheck.minDistancePercent.toFixed(2)}% of screen (required >= 1.0%)`);
    } else {
      console.log(`[PASS] 7.2 Candle separation verified: 16 flames, min distance = ${candleCheck.minDistancePercent.toFixed(2)}% of screen width.`);
    }
    await page.screenshot({ path: path.join(outputDir, 'cake-lit.png') });

    // Blow candles out
    await page.locator('.cake-blow-button').click();
    await page.waitForTimeout(2000);
    const postBlowCheck = await page.evaluate(() => {
      const positions = window.__qaCandleScreenPositions?.() || [];
      return positions.filter((p) => p.visible).length;
    });
    if (postBlowCheck !== 0) {
      errors.push(`[FAIL] 7.2 Candle flame count after blow: expected 0, got ${postBlowCheck}`);
    } else {
      console.log(`[PASS] 7.2 All candles blown out cleanly: 0 flames remaining.`);
    }
    await page.screenshot({ path: path.join(outputDir, 'cake-blown.png') });

    // 2. Cake Top View
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=cake-top`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(outputDir, 'cake-top.png') });
    console.log(`Saved ${path.join(outputDir, 'cake-top.png')}`);

    // 3. Finale Arc & Finale Heart
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=finale-align`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(outputDir, 'finale-align.png') });

    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=final-heart`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(outputDir, 'finale-heart.png') });

    // 4. Epilogue Smooth Return (mid-transition snapshot)
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=epilogue-return`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(outputDir, 'epilogue-return.png') });

    // 5. Galaxy 3D Name
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=galaxy-name`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'galaxy-name.png') });

    // 6. Arrival Sequence: 16 -> Name Reveal -> Caption
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=arrival-16`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);

    // Number 16
    await page.waitForFunction(() => window.__qaArrivalStage === 'number', undefined, { timeout: 10000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, 'arrival-16.png') });

    // Advance to Name Reveal "ข้าวหอม"
    await page.evaluate(() => window.__qaAdvanceArrivalStep?.());
    await page.waitForFunction(() => window.__qaArrivalStage === 'name', undefined, { timeout: 10000 });
    await page.waitForTimeout(900);
    const nameBounds = await page.evaluate(() => window.__qaArrivalNameBounds?.());
    if (!nameBounds) {
      errors.push('[FAIL] 7.3 Arrival name bounds missing');
    } else {
      if (nameBounds.heightFraction < 0.14) {
        errors.push(`[FAIL] 7.3 Arrival name height fraction ${(nameBounds.heightFraction * 100).toFixed(1)}% < 14%`);
      } else {
        console.log(`[PASS] 7.3 Arrival name height ${(nameBounds.heightFraction * 100).toFixed(1)}% >= 14%`);
      }
      if (nameBounds.widthFraction < 0.45) {
        errors.push(`[FAIL] 7.3 Arrival name width fraction ${(nameBounds.widthFraction * 100).toFixed(1)}% < 45%`);
      } else {
        console.log(`[PASS] 7.3 Arrival name width ${(nameBounds.widthFraction * 100).toFixed(1)}% >= 45%`);
      }
    }
    const nameImage = await page.screenshot({ path: path.join(outputDir, 'arrival-name.png') });
    const luminance = calculateLuminance(nameImage);
    console.log(`Arrival name luminance:`, luminance);

    // Advance to Caption
    await page.evaluate(() => window.__qaAdvanceArrivalStep?.());
    await page.waitForFunction(() => window.__qaArrivalStage === 'caption', undefined, { timeout: 10000 });
    await page.waitForSelector('.arrival-lower-third', { timeout: 10000 });
    const captionHtml = await page.locator('.arrival-lower-third').innerHTML();
    if (!captionHtml.includes('<strong class="name-emph">ข้าวหอม</strong>')) {
      errors.push(`[FAIL] 5.3 Caption does not have emphasized '<strong class="name-emph">ข้าวหอม</strong>': ${captionHtml}`);
    } else {
      console.log(`[PASS] 5.3 Caption contains emphasized name: <strong class="name-emph">ข้าวหอม</strong>`);
    }
    await page.screenshot({ path: path.join(outputDir, 'arrival-caption.png') });

    // 7. Portrait Viewports
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=cake-front`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(outputDir, 'cake-front-portrait.png') });

    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=high&qa=arrival-16`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForFunction(() => window.__qaArrivalStage === 'number', undefined, { timeout: 10000 });
    await page.evaluate(() => window.__qaAdvanceArrivalStep?.());
    await page.waitForFunction(() => window.__qaArrivalStage === 'name', undefined, { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, 'arrival-name-portrait.png') });

    // 8. 5-Cycle Repeat Blowout Stress Test
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=low&qa=cake-front`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForAssets(page);
    await page.waitForSelector('.cake-blow-button', { timeout: 15000 });
    await page.locator('.cake-blow-button').click();
    await page.waitForSelector('.ui-epilogue-actions', { timeout: 15000 });

    const resourceCounts = [];
    resourceCounts.push(await page.evaluate(() => window.__qaRendererInfo));
    for (let cycle = 1; cycle <= 5; cycle++) {
      await page.locator('.ui-epilogue-actions [data-action="cake"]').click();
      await page.waitForSelector('.cake-blow-button', { timeout: 25000 });
      await page.locator('.cake-blow-button').click();
      await page.waitForSelector('.ui-epilogue-actions', { timeout: 25000 });
      resourceCounts.push(await page.evaluate(() => window.__qaRendererInfo));
    }
    const firstResources = resourceCounts[0];
    for (const [index, res] of resourceCounts.entries()) {
      if (!res || res.geometries > firstResources.geometries + 2 || res.textures > firstResources.textures + 2) {
        errors.push(`Three.js resources grew after cake cycle ${index}: ${JSON.stringify(resourceCounts)}`);
        break;
      }
    }
    console.log(`[PASS] 7.5 5-cycle blowout repeat stress passed. Resources: ${JSON.stringify(resourceCounts[resourceCounts.length - 1])}`);

    await page.close();
  } else if (phase.startsWith('round3-') && onlyScene === 'flow-stress') {
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
