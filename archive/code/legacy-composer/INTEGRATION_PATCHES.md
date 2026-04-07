# Patch rapide

## `main.js`

Aggiungi:

```js
import { initComposer, updateComposer, getComposerState } from './composer-v2.js';
import { arc, updateDirector } from './director.js';
```

Dentro lo startup, dopo `initDirector(state);`:

```js
initComposer();
```

Nel loop:

```js
const globalTimeSec = now / 1000;
const composerEvents = updateComposer({ state, arc, globalTimeSec });
updateDirector(dt, state, globalTimeSec, canvas.width, canvas.height, getComposerState());
```

## `director.js`

Firma consigliata:

```js
export function updateDirector(dt, state, globalTime, W, H, composerState = null) {
```

Uso consigliato nel corpo:

```js
const intent = composerState?.intent;
const ruptureStage = composerState?.rupture?.stage;
if (ruptureStage === 'TAKEOVER') {
  scene.densityMul = Math.max(scene.densityMul, 1.4);
}
```

## Adapter MIDI temporaneo

```js
export function emitComposerEvents(events, midiOut) {
  for (const e of events) {
    midiOut.sendNote(e.channel, e.note, e.velocity, e.duration, e.time);
  }
}
```
