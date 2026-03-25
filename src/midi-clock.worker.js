// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Clock Worker (high-resolution)
//  Thread separato: non throttolato dal browser.
//  Tick ogni ~2ms per timing MIDI sub-millisecondo.
//  Usa absolute time per eliminare drift cumulativo.
// ═══════════════════════════════════════════════════════════

let running = false;
let lastNow = 0;

function tick() {
  if (!running) return;
  const now = performance.now();
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.05) : 0;
  lastNow = now;
  if (dt > 0) self.postMessage({ dt, now });
  setTimeout(tick, 2);
}

self.onmessage = (e) => {
  if (e.data === 'start' && !running) {
    running = true;
    lastNow = performance.now();
    tick();
  }
  if (e.data === 'stop') {
    running = false;
  }
};
