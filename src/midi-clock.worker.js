// ═══════════════════════════════════════════════════════════
//  MACH:INE III — MIDI Clock Worker (high-resolution)
//  Thread separato: non throttolato dal browser.
//
//  Sessione 27:
//   - Tick ~5ms (era 2ms): 200Hz invece di 500Hz → 60% meno carico
//     sul main thread. Il MIDI clock usa già lookahead scheduling
//     hardware-timed, quindi la precisione dei tick MIDI è invariata.
//   - postMessage passa un primitivo (performance.now()) invece di un
//     oggetto { dt, now } → zero allocazione per tick, GC churn eliminato
//     (prima: ~30k oggetti/min → 1.35M per set di 45 min).
//   - Scheduling con drift compensation: nextTick assoluto, niente deriva
//     cumulativa anche se setTimeout ha jitter.
// ═══════════════════════════════════════════════════════════

let running = false;
let nextTick = 0;
const TICK_MS = 5;

function tick() {
  if (!running) return;
  self.postMessage(performance.now());  // primitivo, nessuna allocazione
  nextTick += TICK_MS;
  const delay = nextTick - performance.now();
  // delay può essere negativo se il worker ha perso colpi: rilancia subito
  setTimeout(tick, delay > 0 ? delay : 0);
}

self.onmessage = (e) => {
  if (e.data === 'start' && !running) {
    running = true;
    nextTick = performance.now() + TICK_MS;
    tick();
  }
  if (e.data === 'stop') {
    running = false;
  }
};
