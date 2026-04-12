# Campo Materiale — Cablaggio infrastrutturale (Sessione A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare campo.js al massimo espressivo: grid rettangolare senza stretch, grana variabile per ruolo, firma a 3 strati di solidificazione.

**Architecture:** campo.js diventa rettangolare (96×54), ogni ruolo renderizza con cellPx proprio, il decay è modulato da 3 strati di solidificazione automatica (silenzio, densità, spazio). La firma (gelo/convergenza/densityCap) viene letta da campo.js.

**Tech Stack:** JavaScript ES modules, Canvas 2D, Float32Array

---

## File Map

| File | Azione | Responsabilità |
|------|--------|----------------|
| `src/config.js` | Modify | Aggiungere cellsX/cellsY, default cellPx per ruolo, soglie solidificazione |
| `src/campo.js` | Modify | Grid rettangolare, render multi-cellPx, firma 3 strati, convergenza |
| `src/biomi.js` | Modify | cellPx per bioma, freeze overrides, CELLS→CELLS_X/CELLS_Y in depositFn |
| `src/field.js` | Modify | Nessuna logica nuova — solo verificare che il path campo passi firma correttamente |
| `src/director3.js` | Modify | Convergenza automatica in dissoluzione |

Nessun file nuovo. Nessun file cancellato.

---

### Task 1: Config — nuovi parametri campo

**Files:**
- Modify: `src/config.js:1160-1167`

- [ ] **Step 1: Aggiungere cellsX, cellsY, defaultCellPx per ruolo, soglie solidificazione**

In `config.js`, sostituire il blocco `campo:` (righe 1162-1167):

```javascript
    campo: {
      useCampo: false,      // false = comp-* classiche, true = campo materiale
      cellsX:   96,         // celle orizzontali (16:9 con cellsY=54)
      cellsY:   54,         // celle verticali
      cellPx:   10,         // pixel per cella offscreen fallback (96*10=960, 54*10=540)
      shimmer:  0.05,       // ampiezza vibrazione moltiplicativa per cella

      // cellPx per ruolo — grana diversa rompe tappezzeria Bayer
      roleCellPx: {
        drone: 16, bass: 14, chord: 10,
        kick: 8, percussion: 8,
        arp: 6, voice: 8, lead: 7,
      },

      // Soglie solidificazione (strato A: silenzio, in secondi)
      silenceThreshold: {
        drone: 8, bass: 4, chord: 3,
        kick: 1, percussion: 1,
        arp: 2, voice: 3, lead: 3,
      },

      // Soglia solidificazione (strato B: densità)
      freezeDensityLo: 0.4,   // sotto = decay normale
      freezeDensityHi: 0.8,   // sopra = quasi permanente

      // Soglia solidificazione (strato C: spaziale Y)
      freezeSpatialLo: 0.5,   // cy/cellsY sotto = volatile
      freezeSpatialHi: 0.9,   // cy/cellsY sopra = sedimentario
    },
```

- [ ] **Step 2: Verificare che il file si carica senza errori**

Run: apri `http://localhost:8282` in browser, verifica che la console non mostri errori.

- [ ] **Step 3: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/config.js
git commit -m "v3.4.3-wip: config — campo grid rettangolare + solidificazione params"
```

---

### Task 2: campo.js — grid rettangolare (96×54)

**Files:**
- Modify: `src/campo.js:1-263`

- [ ] **Step 1: Sostituire _cells con _cellsX/_cellsY, aggiornare tutti i riferimenti**

Sostituire le variabili di stato (righe 36-41):

```javascript
let _fields = null;
let _bioma  = null;
let _cellsX = 96;
let _cellsY = 54;
let _cellPx = 10;
let _W      = _cellsX * _cellPx;
let _H      = _cellsY * _cellPx;
```

Aggiornare `idx`:

```javascript
function idx(cx, cy) { return cy * _cellsX + cx; }
```

Aggiornare `pitchToCell` per usare _cellsY:

```javascript
function pitchToCell(p) { return Math.round((1 - p / 127) * (_cellsY - 1)); }
```

Aggiornare `localPitchToCell` per usare _cellsY:

```javascript
function localPitchToCell(note, lo, hi) {
  if (lo >= hi) return Math.floor(_cellsY / 2);
  const margin = Math.floor(_cellsY * 0.10);
  const usable = _cellsY - 1 - 2 * margin;
  const t = clamp((note - lo) / (hi - lo), 0, 1);
  return Math.round(margin + (1 - t) * usable);
}
```

Aggiornare `depositRow` per usare _cellsX:

```javascript
function depositRow(field, cy, force) {
  if (cy < 0 || cy >= _cellsY) return;
  for (let cx = 0; cx < _cellsX; cx++) depositPoint(field, cx, cy, force);
}
```

Aggiornare `depositPoint` bounds:

```javascript
function depositPoint(field, cx, cy, force) {
  if (cx < 0 || cx >= _cellsX || cy < 0 || cy >= _cellsY) return;
  const i = idx(cx, cy);
  const v = field[i] + force;
  field[i] = v > 1 ? 1 : v < 0 ? 0 : v;
}
```

- [ ] **Step 2: Aggiornare HELPERS**

```javascript
const HELPERS = {
  get CELLS_X() { return _cellsX; },
  get CELLS_Y() { return _cellsY; },
  get CELLS() { return _cellsX; },  // backward compat per depositFn orizzontali
  clamp, pitchToCell, localPitchToCell,
  depositPoint, depositRow, depositBlob,
};
```

- [ ] **Step 3: Aggiornare _ensureBuffers**

```javascript
function _ensureBuffers() {
  if (_fields) return;
  _fields = {};
  for (const r of ROLES) _fields[r] = new Float32Array(_cellsX * _cellsY);
}
```

- [ ] **Step 4: Aggiornare _ensureOffscreen**

```javascript
function _ensureOffscreen() {
  const targetW = _cellsX * _cellPx;
  const targetH = _cellsY * _cellPx;
  if (_off && _W === targetW && _H === targetH) return;
  _W = targetW;
  _H = targetH;
  _off = document.createElement('canvas');
  _off.width  = _W;
  _off.height = _H;
  _offCtx = _off.getContext('2d');
  _imgData = _offCtx.createImageData(_W, _H);
  _imgBuf  = _imgData.data;
}
```

- [ ] **Step 5: Aggiornare initCampo**

```javascript
export function initCampo() {
  _cellsX = CFG.VISUAL?.campo?.cellsX ?? 96;
  _cellsY = CFG.VISUAL?.campo?.cellsY ?? 54;
  _cellPx = CFG.VISUAL?.campo?.cellPx ?? 10;
  _ensureBuffers();
  _ensureOffscreen();
  _bioma = getBiome('GENERIC');
}
```

- [ ] **Step 6: Aggiornare clearAll**

```javascript
export function clearAll() {
  if (!_fields) return;
  for (const r of ROLES) _fields[r].fill(0);
  _particles.chord.length = 0;
  _particles.arp.length = 0;
}
```

- [ ] **Step 7: Aggiornare feedNote — default depositor**

```javascript
  // Default depositors — punto a pitch→Y, X centro
  const cy = pitchToCell(note127);
  const cx = Math.floor(_cellsX / 2);
  const f  = (vel127 / 127) * _bioma.force[role];
  depositPoint(_fields[role], cx, cy, f);
```

- [ ] **Step 8: Aggiornare updateCampo — decay loop bounds**

Nel loop di decay (righe 193-204), sostituire `f.length` (già corretto — Float32Array.length riflette la nuova size). Ma i particles chord/arp usano `_cells`:

```javascript
  // Chord particles
  for (let i = _particles.chord.length - 1; i >= 0; i--) {
    const p = _particles.chord[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.chord.splice(i, 1); continue; }
    const cy = Math.floor(p.cy);
    for (let dx = -p.halfW; dx <= p.halfW; dx++) {
      const falloff = 1 - Math.abs(dx) / (p.halfW + 1);
      depositPoint(_fields.chord, p.cx + dx, cy,     p.headF * falloff);
      depositPoint(_fields.chord, p.cx + dx, cy - 1, p.f     * falloff);
    }
  }

  // Arp particles
  for (let i = _particles.arp.length - 1; i >= 0; i--) {
    const p = _particles.arp[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.arp.splice(i, 1); continue; }
    depositPoint(_fields.arp, p.cx, Math.floor(p.cy), p.f * 0.4);
  }
```

- [ ] **Step 9: Aggiornare renderCampo — render loop con grid rettangolare**

```javascript
export function renderCampo(ctx, W, H) {
  _ensureBuffers();
  _ensureOffscreen();
  if (!_bioma) _bioma = getBiome('GENERIC');

  const data = _imgBuf;
  const [bgR, bgG, bgB] = _bioma.bg;

  // BG fill offscreen
  for (let i = 0; i < data.length; i += 4) {
    data[i]   = bgR;
    data[i+1] = bgG;
    data[i+2] = bgB;
    data[i+3] = 255;
  }

  const defaultRoleCpx = CFG.VISUAL?.campo?.roleCellPx ?? {};

  // Z-order rendering — un pass per ruolo con il suo cellPx
  for (const role of ZORDER) {
    const field = _fields[role];
    const [rC, gC, bC] = _bioma.colors[role];
    if (rC === 0 && gC === 0 && bC === 0) continue;

    const srcR = rC / 255;
    const srcG = gC / 255;
    const srcB = bC / 255;

    // cellPx per ruolo: bioma override > config default > fallback
    const cpx = (_bioma.cellPx && _bioma.cellPx[role])
             ?? defaultRoleCpx[role]
             ?? _cellPx;
    const halfCpx = Math.floor(cpx / 2);

    for (let cy = 0; cy < _cellsY; cy++) {
      for (let cx = 0; cx < _cellsX; cx++) {
        const density = field[cy * _cellsX + cx];
        if (density < 0.003) continue;

        // Posizione proporzionale sull'offscreen
        const centerX = Math.floor((cx + 0.5) * _W / _cellsX);
        const centerY = Math.floor((cy + 0.5) * _H / _cellsY);

        // Area pixel cpx × cpx centrata
        const x0 = Math.max(0, centerX - halfCpx);
        const y0 = Math.max(0, centerY - halfCpx);
        const x1 = Math.min(_W, centerX - halfCpx + cpx);
        const y1 = Math.min(_H, centerY - halfCpx + cpx);

        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            if (density < bayer(px, py)) continue;
            const pi = (py * _W + px) * 4;
            // screen blend
            data[pi]   = ((1 - (1 - srcR) * (1 - data[pi]   / 255)) * 255) | 0;
            data[pi+1] = ((1 - (1 - srcG) * (1 - data[pi+1] / 255)) * 255) | 0;
            data[pi+2] = ((1 - (1 - srcB) * (1 - data[pi+2] / 255)) * 255) | 0;
          }
        }
      }
    }
  }

  _offCtx.putImageData(_imgData, 0, 0);

  // Upscale al canvas — stessa aspect ratio, zero stretch
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_off, 0, 0, _W, _H, 0, 0, W, H);
  ctx.imageSmoothingEnabled = prevSmoothing;
}
```

- [ ] **Step 10: Test visivo — verificare che il campo non è più stretchato**

Run: apri browser, attiva campo (Shift+C), verifica:
- Le celle sono quadrate (non rettangolari)
- Il campo copre l'intero canvas 16:9
- Le note depositano nelle posizioni corrette
Expected: nessuno stretch visibile, celle quadrate.

- [ ] **Step 11: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/campo.js
git commit -m "v3.4.3-wip: campo — grid rettangolare 96x54, render multi-cellPx per ruolo"
```

---

### Task 3: biomi.js — adattare depositFn alla grid rettangolare

**Files:**
- Modify: `src/biomi.js:1-703`

Ogni depositFn che usa `h.CELLS` deve essere aggiornata per usare `h.CELLS_X` (orizzontale) o `h.CELLS_Y` (verticale) a seconda del contesto. Le funzioni che usano `localPitchToCell` sono già corrette (usa _cellsY internamente).

- [ ] **Step 1: SOLCO — aggiornare depositFn**

`chord` (riga 87): `h.CELLS * 0.50` → `h.CELLS_Y * 0.50` (posizione Y)
`h.CELLS * (z[0]...)` → `h.CELLS_X * (z[0]...)` (posizione X)

```javascript
    chord(fields, particles, note127, vel127, h) {
      const intervals = [-7, 0, 4];
      const ZONES = [[0.12, 0.28], [0.38, 0.55], [0.62, 0.78]];
      for (let i = 0; i < intervals.length; i++) {
        const noteP = h.clamp(note127 + intervals[i], 24, 84);
        const z = ZONES[i];
        const cx = Math.floor(h.CELLS_X * (z[0] + Math.random() * (z[1] - z[0])));
        particles.chord.push({
          cx, halfW: 2, cy: h.CELLS_Y * 0.50,
          vy: 0.07,
          f: (vel127 / 127) * 0.11,
          headF: (vel127 / 127) * 0.55,
        });
      }
    },
```

`bass` (riga 101): `h.CELLS - 1` → `h.CELLS_X - 1` (X da nota)

```javascript
    bass(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 24, 43);
      const cy = h.localPitchToCell(noteN, 24, 43);
      const cx = Math.round((noteN - 24) / (43 - 24) * (h.CELLS_X - 1));
      const velN = vel127 / 127;
      const w = Math.round(3 + velN * 2);
      h.depositBlob(fields.bass, cx, cy, w, 3, velN * 0.75);
    },
```

`kick` (riga 109): `h.CELLS * 0.70` → `h.CELLS_Y * 0.70`

```javascript
    kick(fields, particles, note127, vel127, h) {
      const cy = Math.round(h.CELLS_Y * 0.70);
      h.depositRow(fields.kick, cy, 0.80);
    },
```

`arp` (riga 117): `h.CELLS` random → `h.CELLS_X`

```javascript
    arp(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 60, 84);
      const cy = (1 - noteN / 127) * (h.CELLS_Y - 1);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      particles.arp.push({
        cx, cy, vy: 0.05,
        f: (vel127 / 127) * 0.25,
      });
    },
```

`voice` (riga 126-132): `h.CELLS * 0.25/0.75` → `h.CELLS_X * 0.25/0.75`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.pitchToCell(note127);
      const cx0 = Math.floor(h.CELLS_X * 0.25);
      const cx1 = Math.floor(h.CELLS_X * 0.75);
      for (let cx = cx0; cx <= cx1; cx++) {
        h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.50);
      }
    },
```

- [ ] **Step 2: NEBBIA — aggiornare depositFn e audioReact**

`audioReact` (riga 174): `h.CELLS * h.CELLS` → `h.CELLS_X * h.CELLS_Y`

```javascript
  audioReact(fields, energy, h) {
    const n = h.CELLS_X * h.CELLS_Y;
    const f = energy * 0.004;
    if (f < 0.0001) return;
    for (let i = 0; i < n; i++) {
      const v = fields.drone[i] + f;
      fields.drone[i] = v > 1 ? 1 : v;
    }
  },
```

`drone` (riga 189): `h.CELLS` random X → `h.CELLS_X`

```javascript
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 36, 72);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 6, 5, (vel127 / 127) * 0.02);
    },
```

`voice` (riga 194): `h.CELLS` random X → `h.CELLS_X`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.45);
    },
```

`lead` (riga 203): `h.CELLS - 4` → `h.CELLS_X - 4`

```javascript
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 88);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 4));
      const len = 2 + Math.floor(Math.random() * 3);
      const f = (vel127 / 127) * 0.30;
      for (let dx = 0; dx < len; dx++) {
        h.depositPoint(fields.lead, cx + dx, cy, f * (1 - dx / len));
      }
    },
```

- [ ] **Step 3: TESSUTO — aggiornare depositFn**

`drone` (riga 255): gia OK (usa localPitchToCell + depositRow che iterano su _cellsX internamente).

`chord` (riga 261): OK (usa localPitchToCell + depositRow).

`lead` (riga 267): `h.CELLS` random → `h.CELLS_X`

```javascript
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 79);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.lead, cx, cy, (vel127 / 127) * 0.45);
      h.depositPoint(fields.lead, cx + 1, cy, (vel127 / 127) * 0.30);
    },
```

`kick` (riga 276): `h.CELLS * 0.78` → `h.CELLS_Y * 0.78`

```javascript
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.78), 0.70);
    },
```

`bass` (righe 282-288): `h.CELLS * 0.15/0.85` → `h.CELLS_X * 0.15/0.85`

```javascript
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 26, 45);
      const cx0 = Math.floor(h.CELLS_X * 0.15);
      const cx1 = Math.floor(h.CELLS_X * 0.85);
      const f = (vel127 / 127) * 0.50;
      for (let cx = cx0; cx <= cx1; cx++) {
        h.depositPoint(fields.bass, cx, cy, f);
        h.depositPoint(fields.bass, cx, cy + 1, f * 0.5);
      }
    },
```

- [ ] **Step 4: RESPIRO — aggiornare depositFn e audioReact**

`audioReact` (riga 327): `h.CELLS * h.CELLS` → `h.CELLS_X * h.CELLS_Y`

```javascript
  audioReact(fields, energy, h) {
    const target = 0.75;
    const heal = 0.006 + energy * 0.004;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      if (fields.drone[i] < target) {
        fields.drone[i] += heal;
        if (fields.drone[i] > target) fields.drone[i] = target;
      }
    }
  },
```

`voice` (riga 341): `h.CELLS` → `h.CELLS_X` (X random), `h.CELLS` → `h.CELLS_X`/`h.CELLS_Y` (bounds), `py * h.CELLS + px` → `py * h.CELLS_X + px`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(h.CELLS_X * 0.2 + Math.random() * h.CELLS_X * 0.6);
      const r = 2 + Math.floor((vel127 / 127) * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },
```

`lead` (riga 357): stessa logica

```javascript
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 84);
      const cx = Math.floor(h.CELLS_X * 0.3 + Math.random() * h.CELLS_X * 0.4);
      const r = 1 + Math.floor((vel127 / 127));
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },
```

`bass` (riga 374): stessa logica

```javascript
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 36, 48);
      const cx = Math.floor(h.CELLS_X / 2 + (Math.random() - 0.5) * 8);
      const r = 3 + Math.floor((vel127 / 127) * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },
```

`chord` (riga 393): `h.CELLS` → `h.CELLS_X` (loop), `cy * h.CELLS + cx` → `cy * h.CELLS_X + cx`

```javascript
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 60, 77);
      const reduction = (vel127 / 127) * 0.25;
      for (let cx = 0; cx < h.CELLS_X; cx++) {
        const i = cy * h.CELLS_X + cx;
        fields.drone[i] = Math.max(0, fields.drone[i] - reduction);
      }
    },
```

- [ ] **Step 5: MACCHINA — aggiornare depositFn e audioReact**

`audioReact` (riga 438): `h.CELLS * h.CELLS` → `h.CELLS_X * h.CELLS_Y`

```javascript
  audioReact(fields, energy, h) {
    const base = 0.05;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      if (fields.drone[i] < base) {
        fields.drone[i] = base;
      }
    }
  },
```

`arp` (riga 452): `note127 % h.CELLS` → `note127 % h.CELLS_X`

```javascript
    arp(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 81);
      const cx = note127 % h.CELLS_X;
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.90);
    },
```

`kick` (riga 457): `h.CELLS * 0.75` → `h.CELLS_Y * 0.75`

```javascript
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.75), 0.95);
    },
```

`bass` (riga 462-466): `h.CELLS * 0.5` → `h.CELLS_Y * 0.5`, `h.CELLS` Y-loop → `h.CELLS_Y`

```javascript
    bass(fields, particles, note127, vel127, h) {
      const cx = h.localPitchToCell(note127, 26, 45);
      const f = (vel127 / 127) * 0.80;
      for (let cy = Math.floor(h.CELLS_Y * 0.5); cy < h.CELLS_Y; cy++) {
        h.depositPoint(fields.bass, cx, cy, f);
      }
    },
```

`percussion` (riga 471): `h.CELLS * 0.30` → `h.CELLS_Y * 0.30`, `h.CELLS` X-loop → `h.CELLS_X`

```javascript
    percussion(fields, particles, note127, vel127, h) {
      const cy = Math.floor(h.CELLS_Y * 0.30);
      const step = 4;
      for (let cx = 0; cx < h.CELLS_X; cx += step) {
        h.depositPoint(fields.percussion, cx, cy, (vel127 / 127) * 0.60);
      }
    },
```

`voice` (riga 480): `h.CELLS` random → `h.CELLS_X`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 79);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.70);
    },
```

`lead` (riga 487): `h.CELLS` random → `h.CELLS_X`

```javascript
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 69, 88);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.lead, cx, cy, (vel127 / 127) * 0.50);
    },
```

`chord` (riga 494): `h.CELLS` modulo → `h.CELLS_X`

```javascript
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 50, 67);
      const cx = (note127 * 3) % h.CELLS_X;
      const f = (vel127 / 127) * 0.35;
      h.depositPoint(fields.chord, cx, cy, f);
      h.depositPoint(fields.chord, cx + 1, cy, f);
      h.depositPoint(fields.chord, cx, cy + 1, f);
      h.depositPoint(fields.chord, cx + 1, cy + 1, f);
    },
```

- [ ] **Step 6: TEMPESTA — aggiornare depositFn**

`voice` (riga 541): `h.CELLS - 3` → `h.CELLS_X - 3`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 81);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 3));
      const f = (vel127 / 127) * 0.70;
      for (let dx = 0; dx < 3; dx++) {
        h.depositPoint(fields.voice, cx + dx, cy, f * (1 - dx * 0.3));
      }
    },
```

`lead` (riga 550): `h.CELLS - 3` → `h.CELLS_X - 3`

```javascript
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 93);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 3));
      const f = (vel127 / 127) * 0.60;
      for (let dx = 0; dx < 3; dx++) {
        h.depositPoint(fields.lead, cx + dx, cy, f * (1 - dx * 0.3));
      }
    },
```

`kick` (riga 561): `h.CELLS * 0.72` → `h.CELLS_Y * 0.72`

```javascript
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.72), 0.95);
    },
```

`bass` (riga 567): `h.CELLS` random → `h.CELLS_X`

```javascript
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 28, 47);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.bass, cx, cy, 3, 2, (vel127 / 127) * 0.85);
    },
```

`percussion` (riga 573): `h.CELLS * 0.25/0.5` → `h.CELLS_Y * 0.25/0.5`, `h.CELLS` random → `h.CELLS_X`

```javascript
    percussion(fields, particles, note127, vel127, h) {
      const cy = Math.floor(h.CELLS_Y * 0.25 + Math.random() * h.CELLS_Y * 0.5);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.percussion, cx, cy, (vel127 / 127) * 0.65);
      h.depositPoint(fields.percussion, cx + 1, cy, (vel127 / 127) * 0.45);
    },
```

`arp` (riga 581): `h.CELLS` random → `h.CELLS_X`

```javascript
    arp(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 84);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.30);
    },
```

`chord` (riga 588): `h.CELLS * 0.3/0.4` → `h.CELLS_X * 0.3/0.4`

```javascript
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 52, 69);
      const cx0 = Math.floor(Math.random() * h.CELLS_X * 0.3);
      const f = (vel127 / 127) * 0.40;
      for (let cx = cx0; cx < cx0 + Math.floor(h.CELLS_X * 0.4); cx++) {
        h.depositPoint(fields.chord, cx, cy, f);
      }
    },
```

`drone` (riga 598): `h.CELLS` random → `h.CELLS_X`

```javascript
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 40, 64);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 5, 4, 0.010);
    },
```

- [ ] **Step 7: RITORNO — aggiornare depositFn**

`voice` (riga 642): `h.CELLS` random → `h.CELLS_X`

```javascript
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 81);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.50);
    },
```

`lead`, `arp`, `bass`: stessa sostituzione `h.CELLS` → `h.CELLS_X` per X random.

`kick` (riga 671): `h.CELLS * 0.75` → `h.CELLS_Y * 0.75`

`chord`: OK (usa localPitchToCell + depositRow).

`drone` (riga 683): `h.CELLS` random → `h.CELLS_X`

- [ ] **Step 8: Test visivo — verificare tutti i 7 biomi**

Run: apri browser, Shift+C, cambia traccia (1-7). Per ogni bioma verificare:
- Le depositFn non crashano (console pulita)
- Le note vanno nelle posizioni giuste (non fuori bounds)
- Il campo è rettangolare 16:9 senza stretch

- [ ] **Step 9: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/biomi.js
git commit -m "v3.4.3-wip: biomi — CELLS_X/CELLS_Y in tutte le depositFn (7 biomi)"
```

---

### Task 4: campo.js — firma a 3 strati di solidificazione

**Files:**
- Modify: `src/campo.js` (aggiungere import firma + solidificazione in updateCampo + densityCap in feedNote)

- [ ] **Step 1: Aggiungere import e utility**

In testa a campo.js, dopo gli import esistenti:

```javascript
import { CFG } from './config.js';
import { getBiome } from './biomi.js';
import { firma } from './firma.js';
```

Aggiungere helper smoothstep vicino agli altri helper:

```javascript
function smoothstep(lo, hi, x) {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}
```

Aggiungere array silence tracking dopo `_particles`:

```javascript
// Solidificazione strato A: frame di silenzio per ruolo
const _silenceFrames = {};
for (const r of ROLES) _silenceFrames[r] = 0;
```

- [ ] **Step 2: feedNote — aggiungere gelo + densityCap gate**

All'inizio di `feedNote`, prima di qualsiasi deposito:

```javascript
export function feedNote(ch, note127, vel127) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // Firma: gelo blocca nuovi depositi
  if (firma.gelo) return;

  // Firma: densityCap gate probabilistico
  if (firma.densityCap < 1 && Math.random() >= firma.densityCap) return;

  const role = CH_ROLE[ch];
  if (!role) return;
  if (_bioma.force[role] === 0) return;

  // Reset silence counter — questo ruolo sta suonando
  _silenceFrames[role] = 0;

  // ... resto invariato (custom depositFn o default)
```

- [ ] **Step 3: updateCampo — aggiungere gelo + solidificazione 3 strati**

Sostituire l'intera funzione updateCampo:

```javascript
export function updateCampo(dt, audioEnergy = 0) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // ── Firma: gelo totale — nessuna evoluzione ──
  if (firma.gelo) return;

  // ── Audio-reactive (bioma-specifico) ──
  if (_bioma.audioReact) {
    _bioma.audioReact(_fields, audioEnergy, HELPERS);
  }

  const shimmer = CFG.VISUAL?.campo?.shimmer ?? 0.05;
  const cfg = CFG.VISUAL?.campo ?? {};
  const freezeCfg = _bioma.freeze || {};

  // Strato A config
  const silenceThresholds = cfg.silenceThreshold ?? {};
  const freezeRoleEnabled = freezeCfg.roleEnabled !== false;

  // Strato B config
  const fdLo = freezeCfg.densityThreshold ?? cfg.freezeDensityLo ?? 0.4;
  const fdHi = (freezeCfg.densityThreshold ?? cfg.freezeDensityHi ?? 0.8);
  const freezeDensityEnabled = freezeCfg.densityEnabled !== false;

  // Strato C config
  const fsLo = cfg.freezeSpatialLo ?? 0.5;
  const fsHi = cfg.freezeSpatialHi ?? 0.9;
  const freezeSpatialEnabled = freezeCfg.spatial !== false;

  // Override globale (es. RITORNO freeze 50%)
  const globalFreeze = freezeCfg.globalFactor ?? 0;

  // ── Chord particles ──
  for (let i = _particles.chord.length - 1; i >= 0; i--) {
    const p = _particles.chord[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.chord.splice(i, 1); continue; }
    const cy = Math.floor(p.cy);
    for (let dx = -p.halfW; dx <= p.halfW; dx++) {
      const falloff = 1 - Math.abs(dx) / (p.halfW + 1);
      depositPoint(_fields.chord, p.cx + dx, cy,     p.headF * falloff);
      depositPoint(_fields.chord, p.cx + dx, cy - 1, p.f     * falloff);
    }
  }

  // ── Arp particles ──
  for (let i = _particles.arp.length - 1; i >= 0; i--) {
    const p = _particles.arp[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.arp.splice(i, 1); continue; }
    depositPoint(_fields.arp, p.cx, Math.floor(p.cy), p.f * 0.4);
  }

  // ── Convergenza: materia migra verso il centro ──
  if (firma.convergenza) {
    const centerX = Math.floor(_cellsX / 2);
    const centerY = Math.floor(_cellsY / 2);
    const pull = 0.3 * dt;
    for (const r of ROLES) {
      const f = _fields[r];
      // Scansione dal bordo verso il centro per evitare doppi spostamenti
      for (let cy = 0; cy < _cellsY; cy++) {
        for (let cx = 0; cx < _cellsX; cx++) {
          const i = cy * _cellsX + cx;
          if (f[i] < 0.01) continue;
          const dx = cx < centerX ? 1 : cx > centerX ? -1 : 0;
          const dy = cy < centerY ? 1 : cy > centerY ? -1 : 0;
          if (dx === 0 && dy === 0) continue;
          const ni = (cy + dy) * _cellsX + (cx + dx);
          const transfer = f[i] * pull;
          f[i]  -= transfer;
          f[ni] += transfer;
          if (f[ni] > 1) f[ni] = 1;
        }
      }
    }
  }

  // ── Decay + shimmer + solidificazione 3 strati ──
  for (const r of ROLES) {
    const baseDr = _bioma.decay[r];
    if (baseDr >= 1.0) continue;
    const f = _fields[r];

    // Strato A: incrementa silenzio per questo ruolo
    _silenceFrames[r]++;
    const silThresh = (silenceThresholds[r] ?? 3) * 60; // sec → frame @60fps
    const freezeA = freezeRoleEnabled
      ? smoothstep(0, silThresh, _silenceFrames[r])
      : 0;

    for (let i = 0; i < f.length; i++) {
      const density = f[i];
      if (density < 0.001) { f[i] = 0; continue; }

      // Strato B: densità alta si stabilizza
      const freezeB = freezeDensityEnabled
        ? smoothstep(fdLo, fdHi, density)
        : 0;

      // Strato C: parte bassa sedimenta
      const cy = (i / _cellsX) | 0;
      const freezeC = freezeSpatialEnabled
        ? smoothstep(fsLo, fsHi, cy / _cellsY)
        : 0;

      // Composizione: max dei 3 strati + global
      const freezeTotal = Math.max(freezeA, freezeB, freezeC, globalFreeze);

      // effectiveDecay: 1.0 = permanente, baseDr = decay bioma
      const dr = baseDr + (1.0 - baseDr) * freezeTotal;

      f[i] *= dr;

      // Shimmer
      if (f[i] > 0.01) f[i] += (Math.random() * 2 - 1) * shimmer * f[i];
      if (f[i] < 0) f[i] = 0;
      if (f[i] > 1) f[i] = 1;
    }
  }
}
```

- [ ] **Step 4: clearAll — resettare anche silence counters**

```javascript
export function clearAll() {
  if (!_fields) return;
  for (const r of ROLES) {
    _fields[r].fill(0);
    _silenceFrames[r] = 0;
  }
  _particles.chord.length = 0;
  _particles.arp.length = 0;
}
```

- [ ] **Step 5: Test — verificare solidificazione**

Run: apri browser, Shift+C. Suona SOLCO per ~15 secondi, poi ferma.
Expected:
- Il drone (se presente) rallenta il decay dopo ~8s di silenzio
- Le zone dense (bottom) persistono piu a lungo
- I kick spariscono subito (soglia 1s)

Test gelo: premi G → campo si congela. Premi G → riprende.
Test densityCap: le note arrivano solo con probabilita proporzionale a densityCap.

- [ ] **Step 6: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/campo.js
git commit -m "v3.4.3-wip: campo — firma 3 strati solidificazione + gelo + convergenza + densityCap"
```

---

### Task 5: biomi.js — freeze overrides per bioma

**Files:**
- Modify: `src/biomi.js`

- [ ] **Step 1: Aggiungere freeze overrides ai biomi che ne hanno bisogno**

Aggiungere `freeze` e `cellPx` ai biomi specifici. Solo quelli che devono sovrascrivere i default.

In MACCHINA (dopo `depositFn: { ... }`):

```javascript
  // MACCHINA: griglia uniforme, niente stratigrafia, niente aging
  cellPx: {
    drone: 10, bass: 10, chord: 10,
    kick: 10, percussion: 10,
    arp: 10, voice: 10, lead: 10,
  },
  freeze: {
    spatial: false,      // niente stratigrafia — la griglia è uniforme
  },
```

In TEMPESTA (dopo `depositFn: { ... }`):

```javascript
  // TEMPESTA: turbolenza, nulla cristallizza
  freeze: {
    roleEnabled: false,  // nulla cristallizza per silenzio
  },
```

In RESPIRO (dopo `depositFn: { ... }`):

```javascript
  // RESPIRO: membrana elastica, solo altissime si solidificano
  freeze: {
    densityThreshold: 0.9,
  },
```

In RITORNO (dopo `depositFn: { ... }`):

```javascript
  // RITORNO: tutto diventa geologico progressivamente
  freeze: {
    globalFactor: 0.5,
  },
```

In NEBBIA (dopo `depositFn: { ... }`):

```javascript
  // NEBBIA: massimo contrasto di grana — drone grosso, voice fine
  cellPx: {
    drone: 20, voice: 6, lead: 7, chord: 12,
  },
```

- [ ] **Step 2: Test — verificare override per bioma**

Run: browser, Shift+C, scorrere tutti i biomi:
- MACCHINA: grana uniforme (tutte le celle stessa dimensione)
- NEBBIA: drone grosso, voice fine (contrasto visibile)
- TEMPESTA: nulla si solidifica anche dopo silenzio
- RITORNO: tutto decade lentamente (il sedimento persiste)

- [ ] **Step 3: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/biomi.js
git commit -m "v3.4.3-wip: biomi — freeze overrides + cellPx per bioma"
```

---

### Task 6: director3.js — convergenza automatica in dissoluzione

**Files:**
- Modify: `src/director3.js`

- [ ] **Step 1: Import firma**

Verificare se firma è già importata in director3.js:

```bash
grep "firma" "/Users/Edo_1/MACH-INE II/app/src/director3.js"
```

Se non presente, aggiungere in testa:

```javascript
import { firma } from './firma.js';
```

- [ ] **Step 2: Attivare convergenza nella fase dissoluzione**

Nella funzione che aggiorna la fase (dove si calcola `PHASE_ORDER[_phaseIdx]`), dopo il blocco degradation esistente (riga ~243), aggiungere:

```javascript
  // ── Convergenza automatica nell'ultimo 15% della dissoluzione ──
  if (PHASE_ORDER[_phaseIdx] === 'dissoluzione') {
    const phaseDur = _track.phases.dissoluzione || 0;
    if (phaseDur > 0) {
      const progress = _phaseBars / phaseDur;
      firma.convergenza = progress > 0.85;
    }
  } else {
    // Reset convergenza quando non siamo in dissoluzione
    if (firma.convergenza) firma.convergenza = false;
  }
```

- [ ] **Step 3: Test — verificare convergenza**

Run: browser, Shift+C, avvia la musica, aspetta che una traccia arrivi a dissoluzione.
Expected: negli ultimi ~15% della dissoluzione la materia migra verso il centro.
Alla traccia successiva la convergenza si disattiva e il campo torna normale.

- [ ] **Step 4: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/director3.js
git commit -m "v3.4.3-wip: director3 — convergenza automatica in dissoluzione"
```

---

### Task 7: Test integrato + commit finale

- [ ] **Step 1: Test completo**

Run: browser, `http://localhost:8282`
1. Shift+C per attivare campo
2. Verificare: nessuno stretch (celle quadrate su canvas 16:9)
3. Scorrere le 7 tracce — ogni bioma renderizza correttamente
4. Verificare grana: drone ha grana grossa, voice fine (in NEBBIA visibile)
5. G per gelo → campo si congela. G per rilasciare.
6. Aspettare ~10s senza suonare → drone rallenta decay (solidificazione strato A)
7. Console pulita (nessun errore)

- [ ] **Step 2: Aggiornare STATUS.md**

Aggiornare il blocco "Versione" e "Prossimo" in STATUS.md per riflettere:
- v3.4.3-wip
- Grid rettangolare 96x54 funzionante
- Firma cablata nel campo (gelo/convergenza/densityCap)
- Solidificazione 3 strati implementata
- cellPx per ruolo implementato
- P0 nuovo: Camera + RITORNO orbitale (sessione B)

- [ ] **Step 3: Aggiornare WORKLOG.md**

Append nuova entry per questa sessione (sessione 10).

- [ ] **Step 4: Commit finale workflow management**

```bash
cd "/Users/Edo_1/MACH-INE II/app"
git add src/config.js src/campo.js src/biomi.js src/director3.js docs/STATUS.md docs/WORKLOG.md docs/superpowers/
git commit -m "wm: session log 2026-04-12 — campo infrastruttura (grid, lifecycle, firma)"
```

---
