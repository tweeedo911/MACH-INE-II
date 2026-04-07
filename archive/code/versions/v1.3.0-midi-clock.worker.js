// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Clock Worker
//  Gira su thread separato: non viene throttolato dal browser
//  anche quando il focus è su un'altra app (es. Ableton)
// ═══════════════════════════════════════════════════════════

let last = 0;

function tick() {
  const now = performance.now();
  if (last === 0) last = now;
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  self.postMessage({ dt });
  setTimeout(tick, 14); // ~16ms, leggermente sotto per evitare drift
}

self.onmessage = (e) => {
  if (e.data === 'start') tick();
};
