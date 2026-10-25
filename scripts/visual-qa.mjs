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

try {
  await ready();
  browser = await chromium.launch({
    channel: process.env.CHROME_CHANNEL || 'chrome',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader']
  });
  const errors = [];
  if (phase === 'round2-R0') {
    const allScenes = [
      { file: 'name-front.png', query: 'skipintro=1&quality=low&qa=name-front', wait: 2400 },
      { file: 'bulge-closeup.png', query: 'skipintro=1&quality=medium&qa=bulge-closeup', wait: 1200 },
      { file: 'arrival-constellation.png', query: 'skipintro=1&quality=low&qa=arrival-constellation', wait: 1200 },
      { file: 'final-heart.png', query: 'skipintro=1&quality=low&qa=final-heart', wait: 2400 },
      { file: 'signature-earth.png', query: 'skipintro=1&quality=medium&qa=signature-earth', wait: 1200 },
      { file: 'modal-slide.png', query: 'skipintro=1&quality=low&qa=modal-slide', wait: 4200 },
      { file: 'cinema-recorder.png', query: 'cinema=1&quality=low', wait: 1200, record: true },
      { file: 'cake.png', query: 'skipintro=1&quality=low&qa=cake', wait: 2600 },
      { file: 'orbit-visibility.png', query: 'quality=medium&skipintro=1', wait: 1800 }
    ];
    const scenes = onlyScene ? allScenes.filter((scene) => scene.file === `${onlyScene}.png`) : allScenes;
    if (!scenes.length) throw new Error(`Unknown QA scene: ${onlyScene}`);
    for (const scene of scenes) {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', (error) => errors.push(`${scene.file}: ${error.message}`));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`${scene.file}: ${message.text()}`); });
      await page.goto(`${baseUrl}?mute=1&${scene.query}`, { waitUntil: 'domcontentloaded' });
      await waitForAssets(page);
      if (scene.file === 'orbit-visibility.png') {
        await page.locator('#btn-toggle-galaxy').click();
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(scene.wait);
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
        await page.waitForFunction(() => document.querySelector('.cake-blow-button')?.disabled, undefined, { timeout: 5000 });
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
    await page.goto(`${baseUrl}?skipintro=1&mute=1&quality=medium`, { waitUntil: 'domcontentloaded' });
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
        await page.waitForSelector('#memory-modal-backdrop.visible', { timeout: 10000 });
        if (id === 5) {
          await page.waitForFunction(() => document.querySelector('#wish-body')?.textContent?.length > 20, undefined, { timeout: 8000 });
          const downloadPromise = page.waitForEvent('download', { timeout: 8000 });
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
        await page.waitForFunction(() => document.querySelector('#memory-modal-backdrop')?.classList.contains('hidden'), undefined, { timeout: 5000 });
        await page.waitForTimeout(1750);
      }

      const detailPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      detailPage.on('pageerror', (error) => errors.push(`detail: ${error.message}`));
      detailPage.on('console', (message) => { if (message.type() === 'error') errors.push(`detail: ${message.text()}`); });
      await detailPage.goto(`${baseUrl}?mute=1&quality=low&qa=name-front`, { waitUntil: 'domcontentloaded' });
      await waitForAssets(detailPage);
      await detailPage.waitForTimeout(2400);
      await detailPage.screenshot({ path: path.join(outputDir, 'name-front.png') });
      await detailPage.goto(`${baseUrl}?skipintro=1&mute=1&quality=medium&qa=bulge-closeup`, { waitUntil: 'domcontentloaded' });
      await waitForAssets(detailPage);
      await detailPage.waitForTimeout(1200);
      await detailPage.screenshot({ path: path.join(outputDir, 'bulge-closeup.png') });
      await detailPage.goto(`${baseUrl}?skipintro=1&mute=1&quality=low`, { waitUntil: 'domcontentloaded' });
      await waitForAssets(detailPage);
      await detailPage.locator('.heart-dot[data-id="5"]').click();
      await detailPage.waitForSelector('#memory-modal-backdrop.visible', { timeout: 10000 });
      await detailPage.waitForTimeout(1200);
      await detailPage.screenshot({ path: path.join(outputDir, 'quality-low-final-rose.png') });
      await detailPage.close();
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
