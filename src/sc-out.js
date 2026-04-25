// ═══════════════════════════════════════════════════════════
//  MACH:INE III — SC Output (audio engine OSC client)
//  Parallelo a midi.js. Manda WebSocket → bridge → SC OSC.
//  Wave A: drone biome/phase morphing. Wave B: note one-shot per ruolo.
//  No-op silenzioso se WS non connesso (default behavior senza SC running).
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

// Bridge endpoint (machine-sc-bridge.js)
const SC_WS_URL = 'ws://127.0.0.1:9877';
const RECONNECT_DELAY_MS = 2000;

let _enabled = false;       // toggle runtime
let _ws = null;             // active WebSocket | null
let _connecting = false;
let _warnLogged = false;    // log "SC unreachable" only once per disconnection

// ── Public API ──

export function setSCEnabled(enabled) {
  _enabled = !!enabled;
  if (_enabled && !_ws && !_connecting) _connect();
  if (!_enabled && _ws) _disconnect();
  console.log(`[SC] enabled=${_enabled}`);
}

export function isSCEnabled() {
  return _enabled;
}

// /biome/set <name> — applica preset bioma al server (drone in Wave A).
// Chiamato da director3.initDirector3() quando cambia traccia.
export function sendSCBiome(name) {
  _send('/biome/set', [String(name)]);
}

// /phase/set <name> <progress> — applica phase curve (multipliers su amp/cutoff/drift/reverb).
// Chiamato da director3 al cambio fase + ogni ~250ms per il morph continuo del progress.
export function sendSCPhase(name, progress) {
  if (!name) return;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  _send('/phase/set', [String(name), p]);
}

// /synth/<role>/note freq amp dur — Wave B (no-op in Wave A, lo stub SC ignora).
// Già esposto qui per agganciare midi.js ora; quando i SynthDef saranno pronti,
// le note partono senza altri cambi di codice JS.
export function sendSCNote(role, freq, amp, dur) {
  if (!role) return;
  _send('/synth/' + role + '/note', [
    Number(freq) || 0,
    Number(amp) || 0,
    Number(dur) || 0,
  ]);
}

// /panic — silenzia drone, libera tutti i synth.
export function panicSC() {
  _send('/panic', []);
}

// ── Internals ──

function _connect() {
  if (_connecting || _ws) return;
  _connecting = true;
  try {
    _ws = new WebSocket(SC_WS_URL);
  } catch (e) {
    _connecting = false;
    return;
  }

  _ws.onopen = () => {
    _connecting = false;
    _warnLogged = false;
    console.log('[SC] connected to bridge');
    try { window.dispatchEvent(new CustomEvent('sc-available')); } catch (_) {}
  };

  _ws.onclose = () => {
    if (!_warnLogged) {
      console.warn('[SC] bridge unreachable — notes dropped silently');
      _warnLogged = true;
      try { window.dispatchEvent(new CustomEvent('sc-unavailable')); } catch (_) {}
    }
    _ws = null;
    _connecting = false;
    if (_enabled) {
      setTimeout(() => { if (_enabled && !_ws) _connect(); }, RECONNECT_DELAY_MS);
    }
  };

  _ws.onerror = () => {
    // onclose handles cleanup; suppress error spam
  };

  // Optional: read /log /pong replies (currently ignored).
  _ws.onmessage = (_ev) => { /* no-op for Wave A */ };
}

function _disconnect() {
  if (!_ws) return;
  try { _ws.close(); } catch (_) {}
  _ws = null;
  _connecting = false;
}

function _send(address, args) {
  if (!_enabled) return;
  if (!_ws || _ws.readyState !== 1) return;  // 1 = OPEN
  try {
    _ws.send(JSON.stringify({ address, args }));
  } catch (e) {
    // Drop silently — onclose will trigger reconnect if needed.
  }
}

// ── Boot — abilita se CFG.SC_ENABLED true OR ?sc=1 in URL ──
{
  const urlParams = new URLSearchParams(window.location.search);
  const urlEnabled = urlParams.get('sc') === '1';
  if (CFG.SC_ENABLED || urlEnabled) {
    setSCEnabled(true);
  }
}

// ── Debug helper: expose API on window for devtools console ──
// Usage in browser console:
//   __sc.setSCEnabled(true)
//   __sc.sendSCBiome('NEBBIA')          // applica preset timbrico
//   __sc.sendSCPhase('densita', 0.5)    // applica phase curve (amp/cutoff/...)
//   __sc.panicSC()                      // silenzia drone
// Per testare audio SC senza partire la suite (Space): chiama biome+phase a mano.
if (typeof window !== 'undefined') {
  window.__sc = { setSCEnabled, isSCEnabled, sendSCBiome, sendSCPhase, sendSCNote, panicSC };
}
