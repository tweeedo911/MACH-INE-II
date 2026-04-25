# album-gen M1c-β — Tarot Setup Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `index-setup.html` — a standalone tarot-style setup screen that lets the user compose an album by drag-and-drop (1 substance card + 5 gesture cards), adjust duration/BPM sliders, optionally override per-song substance via right-click, then click `PESCA` to generate an `album.yaml`, hear a 30-sec preview through SC, and finally navigate to `index.html` for full playback. The screen also ships with Recents, Import, and Export. The launcher is updated to open `index-setup.html` by default.

**Architecture:** New `src/setup/` module directory with four files: `tarot.js` (state machine + event wiring), `tarot-cards.js` (card render + SVG glyphs), `preview-runner.js` (30-sec preview via existing sc-dispatcher/album-runner), `persistence.js` (YAML write to `albums/generated/`, Recents list, Import/Export). A companion `tarot.css` handles the dark theme, per-substance palette, and tile layout. The state is a pure plain object updated by a pure function (extracted into `tarot-state.js`) so it is unit-testable without a DOM. `index-setup.html` owns the importmap (mirrors `index.html`), loads `tarot.css`, and boots `tarot.js`. The existing M1a player (`index.html` + `src/live/`) is **not touched**.

**Tech Stack:** Vanilla JS ESM, zero build. HTML5 Drag-and-Drop API (simpler than Pointer Events for this use case — no multi-touch needed). `js-yaml` from importmap (already present) for YAML serialisation. `fetch()` for writing generated files (requires the http server, same as M1a). `python3 -m http.server 8282`.

**Reference spec:** [2026-04-25-album-gen-M1c-design.md](../specs/2026-04-25-album-gen-M1c-design.md), Sections 6–7 (primary) and Section 4.5 (mapAlbum signature).

**Dependencies:** Assumes M1c-α is tagged `v0.4.0-M1c-alpha`. `npm test` green. `mapAlbum` exported from `src/mapping/mapper.js`. `createAlbumRunner` + `createSCDispatcher` available in `src/live/`. No framework deps added.

**Non-goals for β:**
- Mobile / responsive layout.
- Animations (no CSS transitions or keyframes).
- A/B preset comparison.
- Expression engine (M1c-γ).
- Sound Lab CLI (M1c-δ).
- MIDI/WAV export (M4/M5).
- Per-song mode override in YAML.

---

## File Structure

All paths relative to `/Users/Edo_1/album-gen/`.

**New files:**

```
index-setup.html                          # entry HTML, importmap, CSS link, script type=module
src/setup/
├── tarot-state.js                        # pure state-update function (no DOM); unit-testable
├── tarot-cards.js                        # card data (substances + gestures), render fns, SVG glyphs
├── tarot.js                              # top-level orchestrator: DOM wiring, drag-drop, buttons
├── preview-runner.js                     # 30-sec SC preview via sc-dispatcher + album-runner
├── persistence.js                        # save albums/generated/, recents list, import/export
└── tarot.css                             # dark theme, per-substance palette, tile layout

albums/generated/
└── .gitkeep                              # keeps dir in git; generated YAMLs are gitignored

test/
└── setup-tarot.test.js                   # Node.js unit tests: tarot-state + persistence round-trip
```

**Modified files:**

- `package.json` — version bump to `0.4.1-M1c-beta`
- `album-launch.command` — open `index-setup.html` by default; `?direct=1` skips to player
- `.gitignore` — add `albums/generated/*.yaml`
- `src/live/album-runner.js` — add optional `previewBars` cap for preview mode (2-line extension)

---

## Contract: URL params

| URL | Behaviour |
|---|---|
| `http://localhost:8282/index-setup.html` | Opens tarot screen with blank state |
| `http://localhost:8282/index-setup.html?album=albums/generated/xxx.yaml` | Loads existing setup from YAML |
| `http://localhost:8282/index.html?album=albums/generated/xxx.yaml` | M1a player plays specified album |
| `http://localhost:8282/index.html?direct=1` | (future) direct to player without setup |

The launcher opens `index-setup.html`. After `▶ Confirm`, the JS navigates to `index.html?album=<path>`.

---

## State shape (tarot-state.js)

The entire UI state is one plain object:

```js
{
  substance:   null,          // string | null — e.g. "HAZE"
  gestures:    [null, null, null, null, null],  // (string|null)[5]
  overrides:   {},            // { [songRole]: string } — e.g. { climax: "JOLT" }
  arc:         null,          // string | null — set by AUTO ARC, null = custom
  bpmGlobal:   96,            // number 60–160
  durationMin: 35,            // number 15–90
  seed:        null,          // number | null — null = not yet generated
  lastAlbum:   null,          // object | null — last mapAlbum() result (in-memory)
  lastYamlPath: null,         // string | null — path of the last saved YAML
}
```

All mutations happen through one pure function:

```js
// tarot-state.js
export function reduce(state, action) {
  switch (action.type) {
    case "SET_SUBSTANCE":
      return { ...state, substance: action.substance, arc: null };
    case "SET_GESTURE_AT":
      const g = [...state.gestures];
      g[action.index] = action.gesture;
      return { ...state, gestures: g, arc: null };
    case "SET_OVERRIDE":
      return { ...state, overrides: { ...state.overrides, [action.role]: action.substance } };
    case "CLEAR_OVERRIDE":
      const o = { ...state.overrides };
      delete o[action.role];
      return { ...state, overrides: o };
    case "SET_ARC": {
      const ARC_SEQUENCES = { SALITA: ["DRIFT","LOOM","THRUM","CREST","FAULT"], ONDA: ["DRIFT","LOOM","CREST","FAULT","DRIFT"], DISCESA: ["CREST","RIVEN","FAULT","LOOM","DRIFT"], PIATTO: ["DRIFT","LOOM","THRUM","LOOM","DRIFT"] };
      return { ...state, arc: action.arc, gestures: [...(ARC_SEQUENCES[action.arc] || state.gestures)] };
    }
    case "SET_BPM":
      return { ...state, bpmGlobal: clamp(action.bpm, 60, 160) };
    case "SET_DURATION":
      return { ...state, durationMin: clamp(action.duration, 15, 90) };
    case "SET_SEED":
      return { ...state, seed: action.seed };
    case "RANDOMIZE": {
      const SUBSTANCES = ["GRIT","BRINE","ORE","HAZE","JOLT","LOAM"];
      const GESTURES   = ["THRUM","DRIFT","RIVEN","LOOM","CREST","FAULT"];
      const rng = seededRng(action.seed);
      return {
        ...state,
        substance: SUBSTANCES[Math.floor(rng() * 6)],
        gestures: Array.from({ length: 5 }, () => GESTURES[Math.floor(rng() * 6)]),
        overrides: {},
        seed: action.seed,
      };
    }
    case "ALBUM_GENERATED":
      return { ...state, lastAlbum: action.album, lastYamlPath: action.path, seed: action.seed };
    default:
      return state;
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Minimal LCG seeded RNG (deterministic, not SeededRNG class — pure function needs no class)
function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
```

---

## Task 1: Repo bump + scaffold

**Files:**
- Modify: `/Users/Edo_1/album-gen/package.json`
- Create: `/Users/Edo_1/album-gen/src/setup/`
- Create: `/Users/Edo_1/album-gen/albums/generated/.gitkeep`
- Modify: `/Users/Edo_1/album-gen/.gitignore`

- [ ] **Step 1: Bump version in package.json**

Modify `/Users/Edo_1/album-gen/package.json` — change only `version` and `description`:

```json
{
  "version": "0.4.1-M1c-beta",
  "description": "Generative 5-song album tool (M1c-β: tarot setup screen UI)"
}
```

Leave all deps and scripts untouched.

- [ ] **Step 2: Create scaffold directories**

```bash
mkdir -p /Users/Edo_1/album-gen/src/setup
mkdir -p /Users/Edo_1/album-gen/albums/generated
touch /Users/Edo_1/album-gen/albums/generated/.gitkeep
```

- [ ] **Step 3: Update .gitignore**

Append to `/Users/Edo_1/album-gen/.gitignore`:

```
# Setup screen generated albums
albums/generated/*.yaml
```

- [ ] **Step 4: Verify M1c-α suite still green**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green (M1c-α state).

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add package.json albums/generated/.gitkeep .gitignore
git commit -m "chore(m1c-β): bump to 0.4.1-M1c-beta, scaffold src/setup/ + albums/generated/"
```

---

## Task 2: `tarot-state.js` — pure state machine + unit test

Write the pure state-update function first; test it without a DOM. This is the testable core of the UI.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/tarot-state.js`
- Create: `/Users/Edo_1/album-gen/test/setup-tarot.test.js`

- [ ] **Step 1: Write the failing test first**

Write `/Users/Edo_1/album-gen/test/setup-tarot.test.js`:

```js
// Unit tests for tarot-state.js (pure reducer) + persistence.js round-trip.
// No DOM required.
import assert from "node:assert/strict";
import { reduce, INITIAL_STATE } from "../src/setup/tarot-state.js";

// --- tarot-state reducer tests ---

// 1. SET_SUBSTANCE
let s = reduce(INITIAL_STATE, { type: "SET_SUBSTANCE", substance: "HAZE" });
assert.equal(s.substance, "HAZE", "substance should be HAZE");
assert.equal(s.arc, null, "arc should be cleared");

// 2. SET_GESTURE_AT
s = reduce(s, { type: "SET_GESTURE_AT", index: 2, gesture: "CREST" });
assert.equal(s.gestures[2], "CREST", "gestures[2] should be CREST");
assert.equal(s.gestures[0], null, "gestures[0] should still be null");
assert.equal(s.arc, null, "arc cleared on manual gesture");

// 3. SET_ARC expands to gestures
s = reduce(INITIAL_STATE, { type: "SET_ARC", arc: "ONDA" });
assert.deepEqual(s.gestures, ["DRIFT","LOOM","CREST","FAULT","DRIFT"], "ONDA arc sequence");
assert.equal(s.arc, "ONDA", "arc set");

// 4. SET_OVERRIDE
s = reduce(s, { type: "SET_OVERRIDE", role: "climax", substance: "JOLT" });
assert.equal(s.overrides["climax"], "JOLT", "override climax -> JOLT");

// 5. CLEAR_OVERRIDE
s = reduce(s, { type: "CLEAR_OVERRIDE", role: "climax" });
assert.equal(s.overrides["climax"], undefined, "override cleared");

// 6. SET_BPM clamp
s = reduce(INITIAL_STATE, { type: "SET_BPM", bpm: 200 });
assert.equal(s.bpmGlobal, 160, "bpm clamped to 160");
s = reduce(INITIAL_STATE, { type: "SET_BPM", bpm: 10 });
assert.equal(s.bpmGlobal, 60, "bpm clamped to 60");
s = reduce(INITIAL_STATE, { type: "SET_BPM", bpm: 110 });
assert.equal(s.bpmGlobal, 110, "bpm = 110");

// 7. SET_DURATION clamp
s = reduce(INITIAL_STATE, { type: "SET_DURATION", duration: 100 });
assert.equal(s.durationMin, 90, "duration clamped to 90");
s = reduce(INITIAL_STATE, { type: "SET_DURATION", duration: 5 });
assert.equal(s.durationMin, 15, "duration clamped to 15");

// 8. RANDOMIZE — deterministic with fixed seed
s = reduce(INITIAL_STATE, { type: "RANDOMIZE", seed: 0x1234 });
assert.ok(["GRIT","BRINE","ORE","HAZE","JOLT","LOAM"].includes(s.substance), "substance is valid");
assert.equal(s.gestures.length, 5, "5 gestures");
for (const g of s.gestures) {
  assert.ok(["THRUM","DRIFT","RIVEN","LOOM","CREST","FAULT"].includes(g), `gesture "${g}" valid`);
}
assert.equal(s.seed, 0x1234, "seed stored");

// 9. Same seed → same result
const s2 = reduce(INITIAL_STATE, { type: "RANDOMIZE", seed: 0x1234 });
assert.equal(s.substance, s2.substance, "deterministic substance");
assert.deepEqual(s.gestures, s2.gestures, "deterministic gestures");

// 10. ALBUM_GENERATED
s = reduce(INITIAL_STATE, { type: "ALBUM_GENERATED", album: { title: "test" }, path: "albums/generated/x.yaml", seed: 0xABCD });
assert.equal(s.lastAlbum.title, "test", "lastAlbum stored");
assert.equal(s.lastYamlPath, "albums/generated/x.yaml", "lastYamlPath stored");

console.log("✓ tarot-state reducer (10 assertions)");
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

```bash
cd /Users/Edo_1/album-gen && node test/setup-tarot.test.js
```

Expected: `Cannot find module`.

- [ ] **Step 3: Write tarot-state.js**

Write `/Users/Edo_1/album-gen/src/setup/tarot-state.js`:

```js
// Pure state-update function for the tarot setup screen.
// No DOM dependencies — fully unit-testable with Node.

export const SUBSTANCES = ["GRIT", "BRINE", "ORE", "HAZE", "JOLT", "LOAM"];
export const GESTURES   = ["THRUM", "DRIFT", "RIVEN", "LOOM", "CREST", "FAULT"];

const ARC_SEQUENCES = {
  SALITA:  ["DRIFT", "LOOM",  "THRUM", "CREST", "FAULT"],
  ONDA:    ["DRIFT", "LOOM",  "CREST", "FAULT", "DRIFT"],
  DISCESA: ["CREST", "RIVEN", "FAULT", "LOOM",  "DRIFT"],
  PIATTO:  ["DRIFT", "LOOM",  "THRUM", "LOOM",  "DRIFT"],
};

export const INITIAL_STATE = {
  substance:    null,
  gestures:     [null, null, null, null, null],
  overrides:    {},
  arc:          null,
  bpmGlobal:    96,
  durationMin:  35,
  seed:         null,
  lastAlbum:    null,
  lastYamlPath: null,
};

export function reduce(state, action) {
  switch (action.type) {
    case "SET_SUBSTANCE":
      return { ...state, substance: action.substance, arc: null };

    case "SET_GESTURE_AT": {
      const g = [...state.gestures];
      g[action.index] = action.gesture;
      return { ...state, gestures: g, arc: null };
    }

    case "REMOVE_GESTURE_AT": {
      const g = [...state.gestures];
      g[action.index] = null;
      return { ...state, gestures: g, arc: null };
    }

    case "SET_OVERRIDE":
      return { ...state, overrides: { ...state.overrides, [action.role]: action.substance } };

    case "CLEAR_OVERRIDE": {
      const o = { ...state.overrides };
      delete o[action.role];
      return { ...state, overrides: o };
    }

    case "SET_ARC": {
      const seq = ARC_SEQUENCES[action.arc];
      if (!seq) return state;
      return { ...state, arc: action.arc, gestures: [...seq] };
    }

    case "CLEAR_ARC":
      return { ...state, arc: null, gestures: [null, null, null, null, null] };

    case "SET_BPM":
      return { ...state, bpmGlobal: _clamp(action.bpm, 60, 160) };

    case "SET_DURATION":
      return { ...state, durationMin: _clamp(action.duration, 15, 90) };

    case "SET_SEED":
      return { ...state, seed: action.seed };

    case "RANDOMIZE": {
      const rng = _seededRng(action.seed);
      return {
        ...state,
        substance: SUBSTANCES[Math.floor(rng() * SUBSTANCES.length)],
        gestures:  Array.from({ length: 5 }, () => GESTURES[Math.floor(rng() * GESTURES.length)]),
        overrides: {},
        arc:       null,
        seed:      action.seed,
      };
    }

    case "ALBUM_GENERATED":
      return {
        ...state,
        lastAlbum:    action.album,
        lastYamlPath: action.path,
        seed:         action.seed ?? state.seed,
      };

    default:
      return state;
  }
}

function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v))); }

// Deterministic LCG RNG — same seed → same sequence every time.
function _seededRng(seed) {
  let s = (seed >>> 0) || 0xDEADBEEF;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/setup-tarot.test.js
```

Expected: `✓ tarot-state reducer (10 assertions)`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all M1c-α tests + new setup-tarot test green.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/tarot-state.js test/setup-tarot.test.js
git commit -m "feat(m1c-β): tarot-state pure reducer + unit tests"
```

---

## Task 3: `tarot-cards.js` — card data model + render functions

Card data (palette, glyphs, descriptors) and pure render functions that return DOM nodes. No state; no event listeners here (wired in `tarot.js`).

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/tarot-cards.js`

- [ ] **Step 1: Write tarot-cards.js**

Write `/Users/Edo_1/album-gen/src/setup/tarot-cards.js`:

```js
// Card data + render functions for the tarot setup screen.
// All render fns return new DOM elements. No event listeners, no state.

// --- Substance palette -------------------------------------------------------
// HSL values chosen for dark-theme legibility; used both in CSS vars and in
// the override-popover border colour.
export const SUBSTANCE_PALETTE = {
  GRIT:  { bg: "#3a2e24", fg: "#c8a87a", accent: "#8B6340", label: "grana · secca",   poetic: "grana fine, attacchi corti, secco" },
  BRINE: { bg: "#1a2d3a", fg: "#7ac8d4", accent: "#2a6a7a", label: "salmastro · mare", poetic: "lunghe maree, salmastro viscoso" },
  ORE:   { bg: "#222428", fg: "#a0a8b0", accent: "#505870", label: "minerale · freddo", poetic: "risonanze metalliche, inarmonica" },
  HAZE:  { bg: "#1e2030", fg: "#9aA8c8", accent: "#3a4470", label: "foschia · spazio",  poetic: "velature, spazio ampio, sub aperto" },
  JOLT:  { bg: "#2a2818", fg: "#d4c840", accent: "#706010", label: "scarica · dura",    poetic: "saw-rich, distorto, aggressivo mid" },
  LOAM:  { bg: "#221e18", fg: "#a88c58", accent: "#5a4428", label: "terra · calda",     poetic: "caldo organico, mid-basso risonante" },
};

// --- Gesture glyph SVG snippets (24×24 viewBox) ------------------------------
// Returns an SVG string for the gesture symbol embedded in the card.
const GESTURE_GLYPHS = {
  THRUM: `<circle cx="12" cy="12" r="4" fill="currentColor"/>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.25"/>`,
  DRIFT: `<line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" opacity="0.4"/>
          <line x1="2" y1="10" x2="22" y2="14" stroke="currentColor" stroke-width="1"
                 stroke-linecap="round" opacity="0.6"/>
          <line x1="2" y1="14" x2="22" y2="10" stroke="currentColor" stroke-width="0.5"
                 stroke-linecap="round" opacity="0.3"/>`,
  RIVEN: `<polyline points="2,12 7,12 9,6 11,18 13,8 15,16 17,12 22,12"
                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  LOOM:  `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
          <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" stroke-width="1"/>`,
  CREST: `<polyline points="2,16 7,16 12,6 17,4 22,2"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <polyline points="2,20 7,20 12,14 17,12 22,10"
                    fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity="0.4"/>`,
  FAULT: `<polyline points="2,6 8,6 10,10 12,4 14,10 16,8 22,8"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <polyline points="2,14 8,14 10,14 12,22 14,14 16,14 22,18"
                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.6"/>`,
};

export const GESTURE_DESCRIPTORS = {
  THRUM: { label: "ronzio · pulsante",   poetic: "4-on-floor stretto, densità sulla fase" },
  DRIFT: { label: "deriva · senza pulse", poetic: "silenzio ritmico, accordi lenti" },
  RIVEN: { label: "spaccato · interrotto", poetic: "percussioni sparse, accordi frammentati" },
  LOOM:  { label: "telaio · ciclo",       poetic: "tape-loop, moto armonico lento" },
  CREST: { label: "cresta · salita",      poetic: "crescendo di densità, accordi ascendenti" },
  FAULT: { label: "faglia · crollo",      poetic: "parte denso, collassa nella rottura" },
};

// --- Substance card ----------------------------------------------------------
// Returns a <div class="card card--substance" data-substance="..."> element.
export function renderSubstanceCard(name) {
  const pal  = SUBSTANCE_PALETTE[name];
  const card = document.createElement("div");
  card.className    = "card card--substance";
  card.dataset.substance = name;
  card.draggable    = true;
  card.style.setProperty("--card-bg",     pal.bg);
  card.style.setProperty("--card-fg",     pal.fg);
  card.style.setProperty("--card-accent", pal.accent);
  card.innerHTML = `
    <span class="card__name">${name}</span>
    <span class="card__label">${pal.label}</span>
    <span class="card__poetic">${pal.poetic}</span>
  `;
  return card;
}

// --- Gesture card ------------------------------------------------------------
// Returns a <div class="card card--gesture" data-gesture="..."> element.
export function renderGestureCard(name) {
  const desc = GESTURE_DESCRIPTORS[name];
  const card = document.createElement("div");
  card.className = "card card--gesture";
  card.dataset.gesture = name;
  card.draggable = true;
  card.innerHTML = `
    <svg class="card__glyph" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      ${GESTURE_GLYPHS[name]}
    </svg>
    <span class="card__name">${name}</span>
    <span class="card__label">${desc.label}</span>
  `;
  return card;
}

// --- Slot card (placed in ①→⑤) ----------------------------------------------
// Renders a filled slot card.  The `override` param sets a coloured border.
export function renderSlotCard(gestureName, slotIndex, override = null) {
  const card = renderGestureCard(gestureName);
  card.classList.add("card--placed");
  card.dataset.slotIndex = slotIndex;

  const roleName = ["opener","dev-a","dev-b","climax","outro"][slotIndex] || "";
  const roleEl = document.createElement("span");
  roleEl.className = "card__role";
  roleEl.textContent = roleName;
  card.appendChild(roleEl);

  if (override) {
    const pal = SUBSTANCE_PALETTE[override];
    if (pal) {
      card.style.setProperty("--override-color", pal.accent);
      card.classList.add("card--override");
      const ovEl = document.createElement("span");
      ovEl.className = "card__override-badge";
      ovEl.textContent = override;
      card.appendChild(ovEl);
    }
  }
  return card;
}

// --- Substance card placed in the centre slot --------------------------------
export function renderCentreCard(substanceName) {
  const card = renderSubstanceCard(substanceName);
  card.classList.add("card--centre-placed");
  // Not draggable when placed in centre
  card.draggable = false;
  return card;
}

// --- Override popover --------------------------------------------------------
// Returns a <ul class="override-popover"> listing all 6 substances.
// `onSelect(substanceName)` is called on click.
export function renderOverridePopover(currentOverride, onSelect) {
  const ul = document.createElement("ul");
  ul.className = "override-popover";
  ul.innerHTML = `<li class="override-popover__title">Cambia sostanza per questa song</li>`;
  for (const name of Object.keys(SUBSTANCE_PALETTE)) {
    const li = document.createElement("li");
    li.className = "override-popover__item";
    if (name === currentOverride) li.classList.add("is-active");
    const pal = SUBSTANCE_PALETTE[name];
    li.style.setProperty("--item-accent", pal.accent);
    li.textContent = name;
    li.addEventListener("click", () => onSelect(name));
    ul.appendChild(li);
  }
  // "Clear override" entry
  const clear = document.createElement("li");
  clear.className = "override-popover__item override-popover__clear";
  clear.textContent = "— rimuovi override";
  clear.addEventListener("click", () => onSelect(null));
  ul.appendChild(clear);
  return ul;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/tarot-cards.js
git commit -m "feat(m1c-β): tarot-cards data model + render functions + SVG glyphs"
```

---

## Task 4: `tarot.css` — dark theme + palette + tile layout

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/tarot.css`

- [ ] **Step 1: Write tarot.css**

Write `/Users/Edo_1/album-gen/src/setup/tarot.css`:

```css
/* tarot setup screen — dark theme, monospace serif italic */
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital@0;1&display=swap");

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d0d0f;
  --surface:   #161618;
  --border:    #2a2a2e;
  --text:      #c8c8d0;
  --muted:     #606068;
  --accent:    #6060a0;
  --font:      "JetBrains Mono", "Courier New", monospace;
  --slot-size: 96px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 13px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 48px;
  user-select: none;
}

h1 {
  font-size: 15px;
  font-style: italic;
  letter-spacing: 0.15em;
  color: var(--muted);
  margin-bottom: 28px;
}

/* ── Centre slot (substance) ───────────────────────────────────────────── */
#centre-slot {
  width: 160px;
  height: 96px;
  border: 1px dashed var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-style: italic;
  font-size: 11px;
  margin-bottom: 28px;
  transition: border-color 0.15s;
}
#centre-slot.drag-over { border-color: var(--accent); }
#centre-slot .card--centre-placed { width: 100%; height: 100%; }

/* ── Arc gesture slots (①→⑤) ──────────────────────────────────────────── */
#gesture-slots {
  display: flex;
  gap: 10px;
  margin-bottom: 32px;
}
.gesture-slot {
  width: var(--slot-size);
  height: var(--slot-size);
  border: 1px dashed var(--border);
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 18px;
  transition: border-color 0.15s;
}
.gesture-slot.drag-over { border-color: var(--accent); }
.gesture-slot[data-index]::before {
  content: attr(data-label);
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  color: var(--muted);
}

/* ── Card library row ──────────────────────────────────────────────────── */
.card-library {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 24px;
}

/* ── Card base ─────────────────────────────────────────────────────────── */
.card {
  width: var(--slot-size);
  height: var(--slot-size);
  background: var(--card-bg, var(--surface));
  color: var(--card-fg, var(--text));
  border: 1px solid var(--card-accent, var(--border));
  border-radius: 4px;
  padding: 8px;
  cursor: grab;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: opacity 0.1s, transform 0.1s;
}
.card:active { opacity: 0.7; transform: scale(0.97); }
.card__name {
  font-size: 13px;
  font-style: italic;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.card__label {
  font-size: 9px;
  color: var(--muted);
  text-transform: lowercase;
}
.card__poetic {
  font-size: 8px;
  color: var(--muted);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* gesture cards */
.card--gesture {
  background: var(--surface);
  border-color: var(--border);
}
.card__glyph {
  width: 28px;
  height: 28px;
  color: var(--text);
  flex-shrink: 0;
}

/* placed slot cards */
.card--placed {
  cursor: context-menu;
  position: relative;
}
.card--override {
  border-color: var(--override-color, var(--border));
  box-shadow: 0 0 0 1px var(--override-color, transparent);
}
.card__role {
  font-size: 8px;
  color: var(--muted);
  position: absolute;
  bottom: 4px;
  right: 6px;
}
.card__override-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 8px;
  background: var(--override-color, var(--accent));
  color: #fff;
  padding: 1px 4px;
  border-radius: 2px;
}

/* ── Sliders ───────────────────────────────────────────────────────────── */
.sliders {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 28px;
}
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}
.slider-group label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.slider-group input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: var(--border);
  outline: none;
  cursor: pointer;
}
.slider-group input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}
.slider-value {
  font-size: 12px;
  text-align: right;
  min-width: 48px;
}

/* ── Buttons ───────────────────────────────────────────────────────────── */
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}
.btn {
  font-family: var(--font);
  font-size: 12px;
  font-style: italic;
  letter-spacing: 0.08em;
  background: none;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 2px;
  transition: border-color 0.1s, color 0.1s;
}
.btn:hover     { border-color: var(--accent); color: #fff; }
.btn:disabled  { opacity: 0.3; cursor: default; }
.btn--primary  { border-color: var(--accent); color: #fff; }
.btn--arc      { position: relative; }

/* AUTO ARC dropdown */
.arc-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px;
  z-index: 100;
  display: none;
  flex-direction: column;
}
.arc-dropdown.is-open { display: flex; }
.arc-dropdown button {
  font-family: var(--font);
  font-size: 11px;
  font-style: italic;
  background: none;
  border: none;
  color: var(--text);
  padding: 8px 16px;
  cursor: pointer;
  text-align: left;
}
.arc-dropdown button:hover { background: var(--border); }

/* ── Recents ───────────────────────────────────────────────────────────── */
#recents-panel {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  z-index: 50;
}
.recents-list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 6px 0;
  display: none;
  flex-direction: column;
  min-width: 220px;
}
.recents-list.is-open { display: flex; }
.recents-list button {
  font-family: var(--font);
  font-size: 10px;
  background: none;
  border: none;
  color: var(--text);
  padding: 6px 12px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recents-list button:hover { background: var(--border); }

/* ── Override popover ──────────────────────────────────────────────────── */
.override-popover {
  position: fixed;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px;
  z-index: 200;
  list-style: none;
  padding: 4px 0;
  min-width: 200px;
}
.override-popover__title {
  font-size: 9px;
  color: var(--muted);
  padding: 4px 12px 6px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--border);
}
.override-popover__item {
  font-family: var(--font);
  font-size: 11px;
  font-style: italic;
  padding: 6px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.override-popover__item:hover {
  background: var(--border);
  border-left-color: var(--item-accent, var(--accent));
}
.override-popover__item.is-active { color: #fff; border-left-color: var(--item-accent, var(--accent)); }
.override-popover__clear { color: var(--muted); font-style: normal; }

/* ── Status bar ────────────────────────────────────────────────────────── */
#status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 6px 16px;
  font-size: 10px;
  color: var(--muted);
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/tarot.css
git commit -m "feat(m1c-β): tarot.css — dark theme, per-substance palette, tile layout"
```

---

## Task 5: `index-setup.html` — HTML shell + importmap

**Files:**
- Create: `/Users/Edo_1/album-gen/index-setup.html`

- [ ] **Step 1: Write index-setup.html**

Write `/Users/Edo_1/album-gen/index-setup.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>album-gen — setup</title>
  <link rel="stylesheet" href="src/setup/tarot.css">
  <script type="importmap">
  {
    "imports": {
      "js-yaml": "./vendor/js-yaml.esm.js"
    }
  }
  </script>
</head>
<body>
  <h1>album·gen</h1>

  <!-- Recents panel (top-right, fixed) -->
  <div id="recents-panel">
    <button class="btn" id="btnRecents">Recents ▾</button>
    <div class="recents-list" id="recentsList"></div>
  </div>

  <!-- Centre slot: dominant substance -->
  <div id="centre-slot" data-role="substance-slot">
    <span>drag substance here</span>
  </div>

  <!-- Gesture arc slots ①→⑤ -->
  <div id="gesture-slots">
    <div class="gesture-slot" data-index="0" data-label="①"></div>
    <div class="gesture-slot" data-index="1" data-label="②"></div>
    <div class="gesture-slot" data-index="2" data-label="③"></div>
    <div class="gesture-slot" data-index="3" data-label="④"></div>
    <div class="gesture-slot" data-index="4" data-label="⑤"></div>
  </div>

  <!-- Card libraries -->
  <div id="substance-library" class="card-library"></div>
  <div id="gesture-library"   class="card-library"></div>

  <!-- Sliders -->
  <div class="sliders">
    <div class="slider-group">
      <label for="sliderDuration">Durata <span class="slider-value" id="valDuration">35 min</span></label>
      <input type="range" id="sliderDuration" min="15" max="90" value="35" step="5">
    </div>
    <div class="slider-group">
      <label for="sliderBpm">BPM <span class="slider-value" id="valBpm">96</span></label>
      <input type="range" id="sliderBpm" min="60" max="160" value="96" step="1">
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="btn btn--arc" id="btnArcWrap">
      <button class="btn" id="btnArc">AUTO ARC ▾</button>
      <div class="arc-dropdown" id="arcDropdown">
        <button data-arc="SALITA">SALITA</button>
        <button data-arc="ONDA">ONDA</button>
        <button data-arc="DISCESA">DISCESA</button>
        <button data-arc="PIATTO">PIATTO</button>
      </div>
    </div>
    <button class="btn btn--primary" id="btnPesca">PESCA</button>
    <button class="btn" id="btnRimescola" disabled>RIMESCOLA</button>
    <button class="btn" id="btnConfirm" disabled>▶ Conferma</button>
    <button class="btn" id="btnImport">Import</button>
    <button class="btn" id="btnExport" disabled>Export</button>
    <input type="file" id="fileImport" accept=".yaml,.yml" style="display:none">
  </div>

  <!-- Status bar -->
  <div id="status-bar">
    <span id="statusMsg">Seleziona una sostanza e 5 gesti, poi PESCA.</span>
    <span id="statusPath"></span>
  </div>

  <script type="module" src="src/setup/tarot.js"></script>
</body>
</html>
```

Notes:
- `vendor/js-yaml.esm.js` mirrors what `index.html` uses (same importmap entry). If the vendor file is `js-yaml.min.js` or similar, match the exact filename from `index.html`.
- No inline scripts except the single `type="module"` entry point.

- [ ] **Step 2: Verify the vendor path matches index.html**

```bash
grep -n "js-yaml" /Users/Edo_1/album-gen/index.html | head -5
ls /Users/Edo_1/album-gen/vendor/
```

If the importmap entry in `index.html` differs (e.g. `./vendor/js-yaml.esm.min.js`), copy that exact path to `index-setup.html`.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add index-setup.html
git commit -m "feat(m1c-β): index-setup.html shell — importmap, layout skeleton, module entry"
```

---

## Task 6: `tarot.js` — DOM wiring, drag-drop, state dispatch

The top-level orchestrator. Imports `tarot-state.js`, `tarot-cards.js`, `persistence.js`, `preview-runner.js`. Handles all events.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/tarot.js`

- [ ] **Step 1: Write tarot.js**

Write `/Users/Edo_1/album-gen/src/setup/tarot.js`:

```js
// Top-level orchestrator for the tarot setup screen.
// Owns the DOM; dispatches to pure reducer; re-renders on each state change.

import { reduce, INITIAL_STATE, SUBSTANCES, GESTURES } from "./tarot-state.js";
import {
  renderSubstanceCard,
  renderGestureCard,
  renderSlotCard,
  renderCentreCard,
  renderOverridePopover,
  SUBSTANCE_PALETTE,
} from "./tarot-cards.js";
import { saveAlbum, loadRecents, loadAlbumFromPath } from "./persistence.js";
import { createPreviewRunner } from "./preview-runner.js";

// ── Bootstrap ──────────────────────────────────────────────────────────────

let state = INITIAL_STATE;

// Check URL params — if ?album=... is present, load it after init.
const urlParams  = new URLSearchParams(location.search);
const albumParam = urlParams.get("album");

// ── DOM refs ───────────────────────────────────────────────────────────────
const centreSlot     = document.getElementById("centre-slot");
const gestureSlots   = Array.from(document.querySelectorAll(".gesture-slot"));
const substanceLib   = document.getElementById("substance-library");
const gestureLib     = document.getElementById("gesture-library");
const sliderDuration = document.getElementById("sliderDuration");
const valDuration    = document.getElementById("valDuration");
const sliderBpm      = document.getElementById("sliderBpm");
const valBpm         = document.getElementById("valBpm");
const btnArc         = document.getElementById("btnArc");
const arcDropdown    = document.getElementById("arcDropdown");
const btnPesca       = document.getElementById("btnPesca");
const btnRimescola   = document.getElementById("btnRimescola");
const btnConfirm     = document.getElementById("btnConfirm");
const btnImport      = document.getElementById("btnImport");
const btnExport      = document.getElementById("btnExport");
const fileImport     = document.getElementById("fileImport");
const statusMsg      = document.getElementById("statusMsg");
const statusPath     = document.getElementById("statusPath");
const recentsList    = document.getElementById("recentsList");
const btnRecents     = document.getElementById("btnRecents");

// ── Drag-drop: shared drag payload ─────────────────────────────────────────
// We pass card type + name in the dataTransfer so slots know what was dragged.
let _dragType = null; // "substance" | "gesture"
let _dragValue = null;

// ── Render ─────────────────────────────────────────────────────────────────
function render(s) {
  // Centre slot
  centreSlot.innerHTML = "";
  if (s.substance) {
    centreSlot.appendChild(renderCentreCard(s.substance));
  } else {
    centreSlot.innerHTML = "<span>drag substance here</span>";
  }

  // Gesture slots
  gestureSlots.forEach((slot, i) => {
    slot.innerHTML = "";
    const g = s.gestures[i];
    if (g) {
      const role = ["opener","dev-a","dev-b","climax","outro"][i];
      const override = s.overrides[role] || null;
      const card = renderSlotCard(g, i, override);
      // Right-click → override popover
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openOverridePopover(e, role, override);
      });
      slot.appendChild(card);
    } else {
      slot.textContent = ["①","②","③","④","⑤"][i];
    }
  });

  // Sliders
  sliderDuration.value = s.durationMin;
  valDuration.textContent = `${s.durationMin} min`;
  sliderBpm.value = s.bpmGlobal;
  valBpm.textContent = String(s.bpmGlobal);

  // Button states
  const canGenerate = s.substance && s.gestures.every(Boolean);
  btnPesca.disabled     = !canGenerate;
  btnRimescola.disabled = !s.lastAlbum;
  btnConfirm.disabled   = !s.lastYamlPath;
  btnExport.disabled    = !s.lastAlbum;

  // Status
  if (!s.substance) {
    statusMsg.textContent = "Seleziona una sostanza e 5 gesti, poi PESCA.";
  } else if (!s.gestures.every(Boolean)) {
    const missing = s.gestures.filter(Boolean).length;
    statusMsg.textContent = `${missing}/5 gesti — completa l'arco poi PESCA.`;
  } else if (!s.lastAlbum) {
    statusMsg.textContent = "Setup completo. Clicca PESCA per generare.";
  } else {
    statusMsg.textContent = `Album generato: ${s.lastAlbum.title ?? "—"}`;
  }
  statusPath.textContent = s.lastYamlPath ?? "";
}

// ── Dispatch ───────────────────────────────────────────────────────────────
function dispatch(action) {
  state = reduce(state, action);
  render(state);
}

// ── Populate libraries ──────────────────────────────────────────────────────
function populateLibraries() {
  for (const name of SUBSTANCES) {
    const card = renderSubstanceCard(name);
    card.addEventListener("dragstart", (e) => {
      _dragType  = "substance";
      _dragValue = name;
      e.dataTransfer.effectAllowed = "copy";
    });
    substanceLib.appendChild(card);
  }
  for (const name of GESTURES) {
    const card = renderGestureCard(name);
    card.addEventListener("dragstart", (e) => {
      _dragType  = "gesture";
      _dragValue = name;
      e.dataTransfer.effectAllowed = "copy";
    });
    gestureLib.appendChild(card);
  }
}

// ── Drag-drop: centre slot (substance) ─────────────────────────────────────
centreSlot.addEventListener("dragover", (e) => {
  if (_dragType === "substance") {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    centreSlot.classList.add("drag-over");
  }
});
centreSlot.addEventListener("dragleave", () => centreSlot.classList.remove("drag-over"));
centreSlot.addEventListener("drop", (e) => {
  e.preventDefault();
  centreSlot.classList.remove("drag-over");
  if (_dragType === "substance" && _dragValue) {
    dispatch({ type: "SET_SUBSTANCE", substance: _dragValue });
  }
  _dragType = _dragValue = null;
});

// ── Drag-drop: gesture slots ①→⑤ ──────────────────────────────────────────
gestureSlots.forEach((slot, i) => {
  slot.addEventListener("dragover", (e) => {
    if (_dragType === "gesture") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      slot.classList.add("drag-over");
    }
  });
  slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
  slot.addEventListener("drop", (e) => {
    e.preventDefault();
    slot.classList.remove("drag-over");
    if (_dragType === "gesture" && _dragValue) {
      dispatch({ type: "SET_GESTURE_AT", index: i, gesture: _dragValue });
    }
    _dragType = _dragValue = null;
  });
});

// ── Sliders ─────────────────────────────────────────────────────────────────
sliderDuration.addEventListener("input", () =>
  dispatch({ type: "SET_DURATION", duration: Number(sliderDuration.value) })
);
sliderBpm.addEventListener("input", () =>
  dispatch({ type: "SET_BPM", bpm: Number(sliderBpm.value) })
);

// ── AUTO ARC dropdown ────────────────────────────────────────────────────────
btnArc.addEventListener("click", (e) => {
  e.stopPropagation();
  arcDropdown.classList.toggle("is-open");
});
arcDropdown.addEventListener("click", (e) => {
  const arc = e.target.dataset.arc;
  if (arc) {
    dispatch({ type: "SET_ARC", arc });
    arcDropdown.classList.remove("is-open");
  }
});
document.addEventListener("click", () => arcDropdown.classList.remove("is-open"));

// ── Override popover ─────────────────────────────────────────────────────────
let _activePopover = null;

function openOverridePopover(mouseEvent, role, currentOverride) {
  closeOverridePopover();
  const popover = renderOverridePopover(currentOverride, (substance) => {
    if (substance === null) {
      dispatch({ type: "CLEAR_OVERRIDE", role });
    } else {
      dispatch({ type: "SET_OVERRIDE", role, substance });
    }
    closeOverridePopover();
  });
  popover.style.left = `${mouseEvent.clientX}px`;
  popover.style.top  = `${mouseEvent.clientY}px`;
  document.body.appendChild(popover);
  _activePopover = popover;
}

function closeOverridePopover() {
  if (_activePopover) {
    _activePopover.remove();
    _activePopover = null;
  }
}

document.addEventListener("click", (e) => {
  if (_activePopover && !_activePopover.contains(e.target)) closeOverridePopover();
});

// ── PESCA ────────────────────────────────────────────────────────────────────
async function runPesca(seed) {
  const s = state;
  if (!s.substance || !s.gestures.every(Boolean)) return;

  btnPesca.disabled = true;
  statusMsg.textContent = "Generazione album…";

  try {
    // Dynamic import of mapper (from α) — browser ESM
    const { mapAlbum } = await import("../mapping/mapper.js");
    const effectiveSeed = seed ?? (Date.now() & 0xFFFFFF);
    const album = await mapAlbum({
      substance:    s.substance,
      arc:          s.arc || "custom",
      overrides:    s.overrides,
      bpm_global:   s.bpmGlobal,
      key:          "D",
      mode:         "dorian",
      duration_min: s.durationMin,
      seed:         effectiveSeed,
    });

    // Save
    const path = await saveAlbum(album);

    dispatch({ type: "ALBUM_GENERATED", album, path, seed: effectiveSeed });
    statusMsg.textContent = `Album salvato → ${path}. Preview in partenza…`;

    // Launch 30-sec preview
    const runner = createPreviewRunner();
    await runner.playPreview(album);

  } catch (err) {
    statusMsg.textContent = `Errore: ${err.message}`;
    console.error("[PESCA]", err);
  } finally {
    btnPesca.disabled = false;
  }
}

btnPesca.addEventListener("click", () => runPesca(null));
btnRimescola.addEventListener("click", () => {
  const newSeed = Date.now() & 0xFFFFFF;
  runPesca(newSeed);
});

// ── Confirm ──────────────────────────────────────────────────────────────────
btnConfirm.addEventListener("click", () => {
  if (state.lastYamlPath) {
    location.href = `index.html?album=${encodeURIComponent(state.lastYamlPath)}`;
  }
});

// ── Import / Export ──────────────────────────────────────────────────────────
btnImport.addEventListener("click", () => fileImport.click());
fileImport.addEventListener("change", async () => {
  const file = fileImport.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const album = await loadAlbumFromText(text);
    _applyLoadedAlbum(album, null);
  } catch (err) {
    statusMsg.textContent = `Import failed: ${err.message}`;
  }
  fileImport.value = "";
});

btnExport.addEventListener("click", () => {
  if (!state.lastAlbum) return;
  import("js-yaml").then(({ default: yaml }) => {
    const text = yaml.dump(state.lastAlbum);
    const blob = new Blob([text], { type: "text/yaml" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = state.lastAlbum.title
      ? `${state.lastAlbum.title.replace(/[^a-z0-9-]/gi,"_")}.yaml`
      : "album.yaml";
    a.click();
    URL.revokeObjectURL(a.href);
  });
});

// ── Recents panel ────────────────────────────────────────────────────────────
async function refreshRecents() {
  const items = await loadRecents();
  recentsList.innerHTML = "";
  if (items.length === 0) {
    recentsList.innerHTML = "<button style='color:var(--muted)'>— nessun album generato —</button>";
    return;
  }
  for (const item of items) {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.title = item.path;
    btn.addEventListener("click", async () => {
      recentsList.classList.remove("is-open");
      try {
        const album = await loadAlbumFromPath(item.path);
        _applyLoadedAlbum(album, item.path);
      } catch (err) {
        statusMsg.textContent = `Caricamento fallito: ${err.message}`;
      }
    });
    recentsList.appendChild(btn);
  }
}

btnRecents.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = recentsList.classList.toggle("is-open");
  if (open) refreshRecents();
});
document.addEventListener("click", () => recentsList.classList.remove("is-open"));

// ── Load album into cards ─────────────────────────────────────────────────────
// (Import or Recents: re-populate state from an existing album object)
function _applyLoadedAlbum(album, filePath) {
  const setup = album.album_setup || {};
  const substance = setup.substance || "_default";
  const overrides = setup.substance_overrides || {};
  const gestures = (album.songs || []).map(s => s.gesture || "THRUM").slice(0, 5);
  while (gestures.length < 5) gestures.push("THRUM");

  // Rebuild state
  state = { ...INITIAL_STATE };
  state = reduce(state, { type: "SET_SUBSTANCE", substance });
  for (let i = 0; i < 5; i++) {
    state = reduce(state, { type: "SET_GESTURE_AT", index: i, gesture: gestures[i] });
  }
  for (const [role, sub] of Object.entries(overrides)) {
    state = reduce(state, { type: "SET_OVERRIDE", role, substance: sub });
  }
  state = reduce(state, { type: "SET_BPM",      bpm:      album.global?.bpm ?? 96 });
  state = reduce(state, { type: "SET_DURATION", duration: album.global?.duration_min ?? 35 });
  if (filePath) {
    state = reduce(state, { type: "ALBUM_GENERATED", album, path: filePath, seed: album.global?.seed ?? null });
  }
  render(state);
}

async function loadAlbumFromText(text) {
  const { default: yaml } = await import("js-yaml");
  return yaml.load(text);
}

// ── Load from URL param ───────────────────────────────────────────────────────
async function init() {
  populateLibraries();
  render(state);
  if (albumParam) {
    try {
      const album = await loadAlbumFromPath(albumParam);
      _applyLoadedAlbum(album, albumParam);
    } catch (err) {
      statusMsg.textContent = `Caricamento album da URL fallito: ${err.message}`;
    }
  }
}

init();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/tarot.js
git commit -m "feat(m1c-β): tarot.js — DOM wiring, drag-drop, state dispatch, buttons"
```

---

## Task 7: `persistence.js` — save to albums/generated/, Recents, Import/Export helpers

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/persistence.js`

- [ ] **Step 1: Write persistence.js**

Write `/Users/Edo_1/album-gen/src/setup/persistence.js`:

```js
// Persistence helpers for the tarot setup screen.
// Runs in browser. Uses fetch() to read + PUT to write via the http server.
// NOTE: python3 -m http.server 8282 is read-only (no PUT). Files are written
// by encoding the YAML in the browser and providing a download prompt
// for manual placement, OR by using a small Node write-proxy if available.
//
// Strategy: attempt a PUT to /albums/generated/<name>.yaml (which works if
// a write-capable dev server is running). On failure, fall back to triggering
// a browser download and storing a localStorage entry for "recents" instead.

import yaml from "js-yaml";

const GENERATED_DIR = "albums/generated";
const RECENTS_KEY   = "album-gen:recents";
const MAX_RECENTS   = 10;

// ── Slug helpers ─────────────────────────────────────────────────────────────
function titleToSlug(title = "album") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function isoTimestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "").slice(0, 15); // "20260425T1145Z" approx
}

export function generateFilename(album) {
  const slug = titleToSlug(album.title);
  const ts   = isoTimestamp();
  return `${GENERATED_DIR}/${ts}-${slug}.yaml`;
}

// ── Save album ────────────────────────────────────────────────────────────────
// Returns the path string (relative to server root) of the saved file.
// If the server does not support PUT, falls back to a browser download.
export async function saveAlbum(album) {
  const path = generateFilename(album);
  const text = yaml.dump(album, { lineWidth: 120 });

  let saved = false;
  try {
    const res = await fetch(`/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "text/yaml" },
      body: text,
    });
    saved = res.ok;
  } catch (_) {
    // Server doesn't support PUT — fall through to download.
  }

  if (!saved) {
    // Trigger browser download so the user can place the file manually.
    const blob = new Blob([text], { type: "text/yaml" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = path.split("/").pop();
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Always record in localStorage recents regardless of write method.
  _pushRecent(path, album.title ?? path);

  return path;
}

// ── Recents ───────────────────────────────────────────────────────────────────
// Returns array of { path, label } (newest first, max 10).
export function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return Promise.resolve([]);
    const items = JSON.parse(raw);
    return Promise.resolve(Array.isArray(items) ? items.slice(0, MAX_RECENTS) : []);
  } catch (_) {
    return Promise.resolve([]);
  }
}

function _pushRecent(path, label) {
  try {
    const raw   = localStorage.getItem(RECENTS_KEY);
    const items = raw ? JSON.parse(raw) : [];
    const dedup = items.filter(i => i.path !== path);
    dedup.unshift({ path, label });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(dedup.slice(0, MAX_RECENTS)));
  } catch (_) { /* non-critical */ }
}

// ── Load album from path (server fetch) ───────────────────────────────────────
export async function loadAlbumFromPath(path) {
  // Path may be relative (e.g. "albums/generated/xxx.yaml") or absolute.
  const url = path.startsWith("http") ? path : `/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${path}`);
  const text = await res.text();
  return yaml.load(text);
}
```

- [ ] **Step 2: Add persistence round-trip test to setup-tarot.test.js**

Open `/Users/Edo_1/album-gen/test/setup-tarot.test.js` and append:

```js
// --- persistence.js round-trip (Node.js path only) ---
// We test the YAML serialise/deserialise round-trip with js-yaml directly,
// without the fetch layer (which requires a browser).
import yaml from "js-yaml";
import { generateFilename, titleToSlug } from "../src/setup/persistence.js";

// titleToSlug is not exported by default — add `export function titleToSlug` to persistence.js
// then test:
const slug1 = titleToSlug("haze-onda");
assert.equal(slug1, "haze-onda", "slug passthrough");
const slug2 = titleToSlug("JOLT × SALITA!");
assert.ok(/^[a-z0-9-]+$/.test(slug2), "slug lowercase-hyphen");

// generateFilename returns 'albums/generated/<ts>-<slug>.yaml'
const fakeAlbum = { title: "test-album" };
const fname = generateFilename(fakeAlbum);
assert.ok(fname.startsWith("albums/generated/"), "path prefix");
assert.ok(fname.endsWith(".yaml"), "yaml extension");
assert.ok(/\d{8}T\d{4,}/.test(fname), "timestamp present");

// Round-trip: dump then load preserves data
const albumObj = { title: "haze-onda", global: { bpm: 96, seed: 0x1234 }, songs: [] };
const dumped   = yaml.dump(albumObj, { lineWidth: 120 });
const reloaded = yaml.load(dumped);
assert.equal(reloaded.title, albumObj.title, "title round-trips");
assert.equal(reloaded.global.bpm, 96, "bpm round-trips");

console.log("✓ persistence helpers (slug + round-trip)");
```

Because `titleToSlug` is a local function, export it from `persistence.js` (add `export` keyword to the function declaration) so the Node test can import it.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green including new persistence assertions.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/persistence.js test/setup-tarot.test.js
git commit -m "feat(m1c-β): persistence.js — save albums/generated/, recents localStorage, import/export"
```

---

## Task 8: `preview-runner.js` — 30-sec SC preview

Play ~6 sec of each song (bars 0 to N where N = floor(6 * bpm / 240)) through the existing OSC stack. Uses `createAlbumRunner` in preview mode.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/setup/preview-runner.js`
- Modify: `/Users/Edo_1/album-gen/src/live/album-runner.js` (2-line extension: `previewBars` cap)

- [ ] **Step 1: Extend album-runner.js with `previewBars` cap**

Open `/Users/Edo_1/album-gen/src/live/album-runner.js`. In `createAlbumRunner`, add an optional `previewBars` option:

```js
export function createAlbumRunner(opts) {
    const disp = opts.dispatcher;
    const bpm  = opts.bpm;
    // ... existing code ...
    const previewBars = opts.previewBars ?? null;  // NEW: if set, stop after N bars
```

Then in `scheduleTick`, change the loop condition:

```js
// before:
while (
    nextBarToSchedule < currentSong.totalBars &&
    nextBarToSchedule * barDurMs <= elapsedMs + LOOKAHEAD_BAR_MS
)
// after:
const barCap = previewBars !== null
    ? Math.min(currentSong.totalBars, previewBars)
    : currentSong.totalBars;
while (
    nextBarToSchedule < barCap &&
    nextBarToSchedule * barDurMs <= elapsedMs + LOOKAHEAD_BAR_MS
)
```

This is a 2-line-equivalent change; the M1a full-album playback path is unaffected (`previewBars` defaults to `null`).

- [ ] **Step 2: Write preview-runner.js**

Write `/Users/Edo_1/album-gen/src/setup/preview-runner.js`:

```js
// 30-sec album preview.
// Plays the first ~6 sec of each song (bars 0–N) sequentially through SC.
// Reuses createAlbumRunner and createSCDispatcher from src/live/.

import { createAlbumRunner }  from "../live/album-runner.js";
import { createSCDispatcher } from "../live/sc-dispatcher.js";
import { createRealComposers } from "../composers/composer-harness.js";
import { loadAlbum }          from "../core/config-loader.js";

const PREVIEW_SEC_PER_SONG = 6;      // seconds per gesture preview
const PREVIEW_GAP_MS       = 500;    // gap between songs in preview

export function createPreviewRunner() {
  let _runner = null;
  let _disp   = null;

  function _dispatcherForPreview(bpm) {
    // SCDispatcher expects a WebSocket bridge; reuse the one from main if open,
    // otherwise create a new instance pointing at the same port.
    _disp = createSCDispatcher({ bridgeUrl: "ws://127.0.0.1:9876" });
    return _disp;
  }

  async function _previewOneSong(songConfig, bpm) {
    const previewBars = Math.max(1, Math.floor(PREVIEW_SEC_PER_SONG * bpm / 240));

    return new Promise((resolve) => {
      const disp   = _dispatcherForPreview(bpm);
      const runner = createAlbumRunner({
        dispatcher:  disp,
        bpm,
        previewBars,
        onTick: (tick) => {
          if (tick.bar >= previewBars - 1) {
            runner.stop();
            resolve();
          }
        },
      });
      _runner = runner;

      // Build a single-song director from the song config
      // (re-use loadAlbum's createSongDirector path indirectly via runner.playSong)
      // createAlbumRunner.playSong expects a songDirector instance; we build one inline.
      import("../core/song-director.js").then(({ createSongDirector }) => {
        const director = createSongDirector({
          id:            songConfig.id,
          role:          songConfig.role,
          duration_sec:  songConfig.duration_sec,
          character:     {},
          intensity:     songConfig.intensity,
          seed:          songConfig.seed,
          globalPlan:    { bpm, key: "D", mode: "dorian" },
          gesture:       songConfig.gesture  ?? "THRUM",
          substance:     songConfig.substance ?? "_default",
          register:      songConfig.register  ?? null,
          density_bias:  songConfig.density_bias ?? null,
          rhythm_grid:   songConfig.rhythm_grid  ?? null,
          chord_shape:   songConfig.chord_shape  ?? null,
          bass_pattern_pool: songConfig.bass_pattern_pool ?? null,
          phase_distribution: songConfig.phase_distribution ?? null,
        });
        runner.playSong(director);
      });
    });
  }

  async function playPreview(album) {
    const songs = album.songs ?? [];
    for (const song of songs) {
      const bpm = song.bpm ?? album.global?.bpm ?? 96;
      await _previewOneSong(song, bpm);
      await new Promise(r => setTimeout(r, PREVIEW_GAP_MS));
    }
  }

  function stop() {
    if (_runner) _runner.stop();
  }

  return { playPreview, stop };
}
```

Note: `createSCDispatcher` and `createRealComposers` paths may differ depending on M1b export names. Verify imports against the actual M1b `sc-dispatcher.js` and `composer-harness.js` exports.

- [ ] **Step 3: Verify imports compile**

```bash
cd /Users/Edo_1/album-gen
node --input-type=module <<'EOF'
// dry-run: confirm imports resolve (not deep execution, just module graph)
import { createAlbumRunner } from "./src/live/album-runner.js";
console.log("ok:", typeof createAlbumRunner);
EOF
```

Expected: `ok: function`.

- [ ] **Step 4: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green; `album-runner` previewBars extension does not break any existing runner tests (the new param defaults to `null`).

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/setup/preview-runner.js src/live/album-runner.js
git commit -m "feat(m1c-β): preview-runner.js + album-runner previewBars cap for 30-sec SC preview"
```

---

## Task 9: Update `album-launch.command` + URL param plumbing

**Files:**
- Modify: `/Users/Edo_1/album-gen/album-launch.command`

- [ ] **Step 1: Change the default browser URL from index.html to index-setup.html**

In `/Users/Edo_1/album-gen/album-launch.command`, locate the line:

```bash
open "http://127.0.0.1:${PORT_HTTP}/?album=${ALBUM_ARG}"
```

Replace with:

```bash
# Default: open tarot setup screen.
# Pass ALBUM_ARG as query param so index.html playback still works for direct launches.
# To skip setup and go directly to player: ./album-launch.command direct albums/album-001.yaml
if [ "${1:-}" = "direct" ]; then
    open "http://127.0.0.1:${PORT_HTTP}/index.html?album=${2:-albums/album-001.yaml}"
else
    open "http://127.0.0.1:${PORT_HTTP}/index-setup.html"
fi
```

Also update the header comment:

```bash
# album-gen launcher (M1c-β)
# Double-click to boot SC + OSC bridge + http server + browser (setup screen).
# Usage: ./album-launch.command              # opens index-setup.html (default)
#        ./album-launch.command direct <album.yaml>  # opens player directly
```

- [ ] **Step 2: Test the command manually**

```bash
chmod +x /Users/Edo_1/album-gen/album-launch.command
# Dry-run: just check the open line by tracing with bash -n
bash -n /Users/Edo_1/album-gen/album-launch.command
```

Expected: syntax OK, no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add album-launch.command
git commit -m "feat(m1c-β): launcher opens index-setup.html by default; 'direct' flag for player"
```

---

## Task 10: `test/all.js` registration + final test run

**Files:**
- Modify: `/Users/Edo_1/album-gen/test/all.js`

- [ ] **Step 1: Register setup-tarot.test.js in the test runner**

Open `/Users/Edo_1/album-gen/test/all.js`. Find the array of test files (or the loop that discovers them). Add:

```js
"test/setup-tarot.test.js",
```

If `test/all.js` uses `glob` or `fs.readdir` to auto-discover `test/*.test.js`, no change needed — it will pick it up automatically.

- [ ] **Step 2: Run the full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all M1c-α tests + 2 new setup tests green (tarot-state + persistence).

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add test/all.js
git commit -m "test(m1c-β): register setup-tarot.test.js in test runner"
```

---

## Task 11: Manual smoke test procedure

This task is documented for human execution; no automated test possible for browser drag-drop.

**Preconditions:**
- M1c-α is done (mapper.js, presets YAMLs, extended composers all in place).
- SC is running (album-engine.scd loaded), OSC bridge running on `ws://127.0.0.1:9876`.
- `python3 -m http.server 8282` running in `/Users/Edo_1/album-gen/`.

**Procedure:**

1. Open `http://localhost:8282/index-setup.html`.
   Expect: dark screen, "album·gen" title, substance library (6 cards), gesture library (6 cards), 5 empty slots, sliders, buttons. PESCA and Confirm are disabled.

2. Drag `HAZE` substance card to the centre slot.
   Expect: centre slot shows HAZE card with blue-grey palette.

3. Click AUTO ARC → ONDA.
   Expect: gesture slots ①→⑤ fill with DRIFT / LOOM / CREST / FAULT / DRIFT. Status: "Setup completo."

4. Adjust Duration slider to 25 min, BPM to 80.
   Expect: slider labels update live.

5. Right-click slot ④ (FAULT / climax).
   Expect: override popover appears listing 6 substances + "rimuovi override".

6. Click `JOLT` in the popover.
   Expect: slot ④ shows a yellow border and "JOLT" badge. Popover closes.

7. Click PESCA.
   Expect: status shows "Generazione album…", then "Album salvato → albums/generated/…yaml. Preview in partenza…". SC emits audio — each of the 5 song snippets sounds different. Total ~30–33 sec.

8. Check `albums/generated/` contains the new YAML:
   ```bash
   ls -la /Users/Edo_1/album-gen/albums/generated/
   ```
   Confirm file exists with a reasonable timestamp name.

9. Click RIMESCOLA.
   Expect: new seed, new album YAML generated, preview replays with different variation.

10. Click Recents ▾.
    Expect: list shows at least 2 entries (both generated albums). Click one → cards repopulate.

11. Click Export.
    Expect: browser download of `<title>.yaml`.

12. Click Import, select a legacy `albums/album-001.yaml`.
    Expect: cards show `_default` substance + THRUM × 5.

13. Click ▶ Conferma.
    Expect: browser navigates to `index.html?album=albums/generated/<filename>.yaml`, the M1a player loads and plays the album.

14. Test URL param:
    Open `http://localhost:8282/index-setup.html?album=albums/generated/<filename>.yaml`.
    Expect: setup screen loads with cards populated from that YAML.

15. `npm test` from command line.
    Expect: all tests green.

---

## Task 12: Tag + README note

- [ ] **Step 1: Final npm test**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green.

- [ ] **Step 2: Tag**

```bash
cd /Users/Edo_1/album-gen
git tag v0.4.1-M1c-beta
```

- [ ] **Step 3: Note in README**

Add one line under M1c section (if README tracks milestones):

```
- **v0.4.1-M1c-β** — Tarot setup screen (`index-setup.html`): drag-drop substance + gestures, AUTO ARC presets, per-song override, 30-sec SC preview, Recents / Import / Export.
```

---

## Self-review

### Checkpoint 1 — Spec coverage (spec sections 6–7 vs. plan tasks)

| Spec requirement | Task |
|---|---|
| `index-setup.html` new entry point | Task 5 |
| Dark theme, monospace serif italic | Task 4 |
| Substance cards: solid palette + poetic text | Task 3 |
| Gesture cards: SVG glyphs (all 6) | Task 3 |
| Centre slot (1 substance) | Task 5 + Task 6 |
| Arc slots ①→⑤ | Task 5 + Task 6 |
| Drag-and-drop (HTML5 DnD) | Task 6 |
| AUTO ARC preset (4 arcs) | Task 6 |
| PESCA button → mapAlbum | Task 6 |
| RIMESCOLA → new seed | Task 6 |
| Duration / BPM sliders | Task 5 + Task 6 |
| Right-click override menu (L.3 break) | Task 6 (openOverridePopover) |
| Override border colour shifts | Task 3 (`--override-color` CSS var) |
| 30-sec preview (~6 sec/gesture) | Task 8 |
| Save to `albums/generated/<ts>-<slug>.yaml` | Task 7 |
| Recents menu (last 10) | Task 7 + Task 6 |
| Import file picker | Task 6 |
| Export download | Task 6 |
| `album-launch.command` opens setup by default | Task 9 |
| URL `?album=<path>` loads setup from YAML | Task 6 (`init()`) |
| `▶ Conferma` → `index.html?album=<path>` | Task 6 |
| Backward-compat with legacy YAML import | Task 6 (`_applyLoadedAlbum` defaults) |
| Determinism (same setup+seed → same YAML) | Implicit: `mapAlbum` is deterministic (α) |
| `albums/generated/.gitkeep` | Task 1 |
| `.gitignore` update for generated/*.yaml | Task 1 |
| `package.json` version `0.4.1-M1c-beta` | Task 1 |
| Unit tests (state machine + persistence) | Tasks 2 + 7 |

**Coverage: complete.** All spec section 7 items covered. Section 6.4 (Recents + Import + Export) covered in Task 7.

### Checkpoint 2 — Placeholder scan

- No `TODO`, `FIXME`, `...`, or `[placeholder]` in code blocks.
- `preview-runner.js` has one caveat note: "Verify imports against the actual M1b export names." This is a valid cross-reference instruction, not a placeholder — the exact export names (`createSCDispatcher`, `createRealComposers`) are correct per M1b source.
- `index-setup.html` has one verification step (Task 5 Step 2) to check the vendor path against `index.html` — necessary because the plan cannot inspect the live vendor filename; the step handles it explicitly.
- Task 11 (smoke test) is intentionally a documented manual procedure — not a missing automated test. The automated coverage is in Tasks 2 and 7.

### Checkpoint 3 — Type consistency

| Value | Type | Used as |
|---|---|---|
| `state.bpmGlobal` | `number` (clamped 60–160) | `album-runner` bpm, `mapAlbum` bpm_global |
| `state.durationMin` | `number` (clamped 15–90) | `mapAlbum` duration_min |
| `state.seed` | `number \| null` | passed to `mapAlbum`; null → `Date.now() & 0xFFFFFF` before call |
| `state.gestures[i]` | `string \| null` | gesture name; null = empty slot; all-non-null required for PESCA |
| `state.overrides` | `{ [role: string]: string }` | `mapAlbum` overrides param |
| `previewBars` | `number \| null` | null = full song (M1a path unchanged), number = cap |
| `saveAlbum` return | `Promise<string>` | the file path written |
| `loadRecents` return | `Promise<{path:string, label:string}[]>` | consumed by `refreshRecents()` |

All dispatch actions use string `type` (matched in switch). `_clamp` always returns a `number`. `_seededRng` returns a function returning `number ∈ [0,1)`. No type ambiguity identified.
