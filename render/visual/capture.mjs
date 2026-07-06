// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Visual frame capture (Playwright headless)
//  Avvia un server statico su app/, guida offline.html a timestep fisso,
//  cattura ogni frame del canvas → PNG sequence. Poi ffmpeg → video (vedi to-video.sh).
//
//  Uso:
//    SECONDS=10 FPS=30 SEED=42 OUT=frames-test node capture.mjs
//    SECONDS=0  → intera durata (richiede DURATION env o default 2098)
// ═══════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dir, '../..');               // app/
const PORT = Number(process.env.PORT || 8285);
const FPS = Number(process.env.FPS || 30);
const SECONDS = Number(process.env.SECONDS || 10);
const DURATION = Number(process.env.DURATION || 2098);
const SEED = process.env.SEED || '42';
const OUT = resolve(__dir, process.env.OUT || 'frames-test');
const FRAMES = Math.round(FPS * (SECONDS > 0 ? SECONDS : DURATION));

mkdirSync(OUT, { recursive: true });

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: APP, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1300));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const JUMP = process.env.JUMP ? `&jump=${process.env.JUMP}` : '';
const PHASE = process.env.PHASE ? `&phase=${process.env.PHASE}` : '';
await page.goto(`http://localhost:${PORT}/render/visual/offline.html?fps=${FPS}&seed=${SEED}${JUMP}${PHASE}`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 20000 });
const info0 = await page.evaluate('window.__simInfo()');
console.log('[capture] driver ready', JSON.stringify(info0), '→', FRAMES, 'frames');

const TYPE = process.env.TYPE || 'png';            // 'png' (lossless) | 'jpeg' (leggero, per full)
const QUALITY = Number(process.env.QUALITY || 92);
const EXT = TYPE === 'jpeg' ? 'jpg' : 'png';
const c = page.locator('#c');
const t0 = Date.now();
for (let f = 0; f < FRAMES; f++) {
  const info = await page.evaluate('window.__renderStep()');
  const shotOpts = { path: `${OUT}/frame_${String(f).padStart(6, '0')}.${EXT}` };
  if (TYPE === 'jpeg') { shotOpts.type = 'jpeg'; shotOpts.quality = QUALITY; }
  await c.screenshot(shotOpts);
  if (f % 120 === 0) console.log(`  frame ${f}/${FRAMES}  t=${info.t.toFixed(1)}s  ${info.track}/${info.phase}`);
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`[capture] done ${FRAMES} frames in ${secs}s → ${OUT}`);

await browser.close();
srv.kill();
process.exit(0);
