// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Layer Stack
//  Quattro layer canonici stackati come offscreen persistenti.
//
//  Ref: Visual System Bible §5 (Architettura del campo):
//    BG       → clima materiale della traccia (colore ambiente)
//    MG       → composizione spaziale dominante (bande, griglia, blocchi)
//    FG       → eventi MIDI diretti, protagonisti della frase
//    OVERLAY  → sedimenti, ghost fields, misregistration, memory masks
//
//  Ogni layer è un canvas offscreen che vive tra i frame. Le comp-*
//  scrivono nei layer invece di disegnare direttamente su ctx. Alla
//  fine del frame `compositeLayers(ctx)` li fonde nell'ordine
//  canonico (BG → MG → FG → OVERLAY).
//
//  Regola di stacking (Bible §5.2): i layer non si sommano tutti alla
//  massima intensità. Ogni traccia deve avere uno strato dominante,
//  uno di supporto, uno di evento e uno di residuo. La responsabilità
//  di bilanciarli è della singola comp-* (con i decayRate + alpha).
//
//  Infrastruttura pura. Le comp-* non la consumano ancora: A.4
//  migrerà ciascuna comp a scrivere nei layer invece che su ctx
//  diretto, una traccia alla volta.
// ═══════════════════════════════════════════════════════════

import { Sediment } from './visual-toolkit.js';
import { firma } from './firma.js';

// ── Nomi canonici ──
export const LAYER_BG      = 'bg';
export const LAYER_MG      = 'mg';
export const LAYER_FG      = 'fg';
export const LAYER_OVERLAY = 'overlay';

const LAYER_ORDER = [LAYER_BG, LAYER_MG, LAYER_FG, LAYER_OVERLAY];

// ── Decay defaults (per frame, rate 0..1 come Sediment) ──
// Ogni layer ha un proprio decay di default che la comp può override.
// Regole generali:
//  - BG quasi immortale (ambient)
//  - MG lento (struttura spaziale)
//  - FG medio (eventi che svaniscono)
//  - OVERLAY molto lento (memoria, fossil, ghost)
const DEFAULT_DECAY = {
  [LAYER_BG]:      0.995, // quasi fermo — ambient/color wash
  [LAYER_MG]:      0.97,  // struttura spaziale, decade lento
  [LAYER_FG]:      0.90,  // eventi, decade visibile
  [LAYER_OVERLAY]: 0.985, // residuo/ghost, decade lentissimo
};

// ── Alpha per layer al momento del composite (default 1.0 = pieno) ──
const DEFAULT_COMPOSITE_ALPHA = {
  [LAYER_BG]: 1,
  [LAYER_MG]: 1,
  [LAYER_FG]: 1,
  [LAYER_OVERLAY]: 1,
};

// ── Stato del modulo ──
const _layers = {};           // name → Sediment
const _decayRates = { ...DEFAULT_DECAY };
const _compositeAlphas = { ...DEFAULT_COMPOSITE_ALPHA };
let _W = 0, _H = 0;
let _initialized = false;

// ── API ──

export function initLayers(W, H) {
  _W = W;
  _H = H;
  for (const name of LAYER_ORDER) {
    _layers[name] = new Sediment();
    _layers[name].clear(W, H);
  }
  _initialized = true;
}

export function resizeLayers(W, H) {
  _W = W;
  _H = H;
  // Sediment._ensure fa resize+clear al prossimo decay/getCtx — niente da fare ora
}

// Ritorna il contesto 2D del layer per disegnarci dentro.
// initLayers() e updateLayers() garantiscono che il canvas esista
// della size corrente; qui basta ritornare getCtx.
export function getLayerCtx(name) {
  if (!_initialized) return null;
  const s = _layers[name];
  if (!s) return null;
  // Safety: se la dimensione è cambiata (resize) ri-ensuriamo via clear.
  // clear() chiama _ensure internamente, preservando o ricreando il canvas.
  if (!s._canvas || s._w !== _W || s._h !== _H) {
    s.clear(_W, _H);
  }
  return s.getCtx();
}

// Override del decay rate di un layer (per-comp tuning)
export function setLayerDecay(name, rate) {
  if (name in _decayRates) _decayRates[name] = rate;
}

// Reset del decay rate al default
export function resetLayerDecay(name) {
  if (name in DEFAULT_DECAY) _decayRates[name] = DEFAULT_DECAY[name];
}

// Reset di tutti i decay rate
export function resetAllDecayRates() {
  for (const name of LAYER_ORDER) _decayRates[name] = DEFAULT_DECAY[name];
}

// Alpha applicata al composite di un layer (es. sediment a 0.5 in comp-quadrati)
export function setLayerCompositeAlpha(name, alpha) {
  if (name in _compositeAlphas) _compositeAlphas[name] = alpha;
}

// Decay per-frame di tutti i layer.
// firma.gelo → skip totale (nessun decay = frame cristallizzato nei layer)
export function updateLayers(dt) {
  if (!_initialized) return;
  if (firma.gelo) return;
  for (const name of LAYER_ORDER) {
    _layers[name].decay(_W, _H, _decayRates[name]);
  }
}

// Cancella tutti i layer — su REGEN / track switch / session reset.
// Resetta anche decay rates e composite alphas ai default.
export function clearAllLayers() {
  if (!_initialized) return;
  for (const name of LAYER_ORDER) {
    _layers[name].clear(_W, _H);
    _decayRates[name] = DEFAULT_DECAY[name];
    _compositeAlphas[name] = DEFAULT_COMPOSITE_ALPHA[name];
  }
}

// Cancella un singolo layer
export function clearLayer(name) {
  if (!_initialized) return;
  const s = _layers[name];
  if (s) s.clear(_W, _H);
}

// Fonde i layer su ctx nell'ordine canonico BG → MG → FG → OVERLAY.
// Rispetta per-layer composite alpha (setLayerCompositeAlpha).
// Le comp-* chiameranno questa funzione alla fine del loro render.
export function compositeLayers(ctx) {
  if (!_initialized) return;
  for (const name of LAYER_ORDER) {
    const alpha = _compositeAlphas[name];
    if (alpha !== 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      _layers[name].composite(ctx);
      ctx.restore();
    } else {
      _layers[name].composite(ctx);
    }
  }
}

// Debug helper
export function getLayerStats() {
  return {
    initialized: _initialized,
    W: _W, H: _H,
    layers: LAYER_ORDER.map(n => ({ name: n, decay: _decayRates[n] })),
  };
}
