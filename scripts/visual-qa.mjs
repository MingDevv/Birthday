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

try {
  await ready();
  browser = await chromium.launch({
    channel: process.env.CHROME_CHANNEL || 'chrome',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader']
  });
  const errors = [];
  for (const viewport of [
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
    await page.waitForSelector('#asset-loading.asset-loading-done', { timeout: 20000 });
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
