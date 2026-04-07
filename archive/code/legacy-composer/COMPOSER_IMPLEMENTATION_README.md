# Composer implementation starter

Files:
- `composer-config.js`: hard constraints and defaults
- `composer-core.js`: state machine and function stubs

Integration steps:
1. Import `COMPOSER_CFG` into your composer layer.
2. Create a persistent `composerState` with `createComposerState()`.
3. Call `tickComposer(state, dtSec, analysis)` once per frame or musical tick.
4. Replace placeholder generators with real MIDI event generation.
5. Feed generated events into the existing MIDI routing / visual mapping.

Minimal event shape:
```js
{
  layer: 'lead',
  timeSec: 12.4,
  pitch: 61,
  pitchClass: 'C#',
  velocity: 84,
  durationSec: 0.33,
  channel: 4,
}
```
