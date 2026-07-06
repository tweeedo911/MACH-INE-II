// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Browser-globals shim per girare il music engine in Node.
//  performance.now() restituisce il tempo SIMULATO (ms) da globalThis.__SIM_NOW_MS,
//  così session-recorder timestampa gli eventi in sim-time, non wall-clock.
//  Caricato come primo import statico dell'harness.
// ═══════════════════════════════════════════════════════════════════

globalThis.__SIM_NOW_MS = 0;

const noop = () => {};
const fakeCtx = new Proxy({}, { get: () => () => {} });
function fakeCanvas() {
  return {
    width: 1920, height: 1080, style: {},
    getContext: () => fakeCtx,
    addEventListener: noop,
    toDataURL: () => { throw new Error('no-canvas'); },
  };
}
const fakeEl = () => ({ style: {}, addEventListener: noop, appendChild: noop, setAttribute: noop, getContext: () => fakeCtx });

// performance: tempo simulato
globalThis.performance = { now: () => globalThis.__SIM_NOW_MS };

// window === globalThis (così window.X e X bare risolvono uguale)
const w = globalThis;
w.innerWidth = 1920;
w.innerHeight = 1080;
w.addEventListener = noop;
w.removeEventListener = noop;
w.dispatchEvent = () => true;
w.location = { search: '', href: '', hash: '', pathname: '/' };
w.screen = { width: 1920, height: 1080 };
w.requestAnimationFrame = () => 0;
w.cancelAnimationFrame = noop;
w.open = () => null;
w.window = w;

globalThis.document = {
  hidden: false,
  getElementById: () => null,
  createElement: (tag) => (tag === 'canvas' ? fakeCanvas() : fakeEl()),
  addEventListener: noop,
  body: { appendChild: noop },
  documentElement: { style: {} },
};

globalThis.CustomEvent = class { constructor(type, init) { this.type = type; Object.assign(this, init || {}); } };
globalThis.navigator = { requestMIDIAccess: undefined };
globalThis.OffscreenCanvas = class { constructor() { return fakeCanvas(); } };
globalThis.ImageData = class { constructor(width, height) { this.width = width; this.height = height; this.data = new Uint8ClampedArray((width * height * 4) || 4); } };
globalThis.WebSocket = class { constructor() { this.readyState = 3; } send() {} close() {} };
globalThis.BroadcastChannel = class { constructor() {} postMessage() {} close() {} };
globalThis.Worker = class { constructor() {} postMessage() {} terminate() {} };

export {};
