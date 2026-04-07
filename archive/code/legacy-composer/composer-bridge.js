import { mapDirectorPhaseToComposer } from './composer-core.js';

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

export function buildComposerDirectives(intent, arc, ruptureState) {
  const phase = mapDirectorPhaseToComposer(intent?.phase || arc?.phase);
  const density = clamp(intent?.composerBias?.density ?? intent?.intensity ?? 0.3);
  const silence = clamp(intent?.composerBias?.silence ?? intent?.voidness ?? 0.25);
  const dissonance = clamp(intent?.composerBias?.dissonance ?? intent?.tension ?? 0.2);
  return {
    phase,
    kickDensity: clamp(lerp(0.15, 1.0, density)),
    bassGravity: clamp(lerp(0.5, 1.0, density * 0.7 + (1 - silence) * 0.3)),
    harmonyChangeProb: clamp(lerp(0.05, 0.8, density * 0.6 + dissonance * 0.4)),
    leadSilenceMin: lerp(7.5, 2.2, 1 - silence),
    grainDensity: phase === 'GERMOGLIO' || phase === 'DISSOLUZIONE' ? 0 : clamp(lerp(0.1, 1.0, density + dissonance * 0.25)),
    droneStability: phase === 'GERMOGLIO' || phase === 'DISSOLUZIONE' ? 1 : clamp(1 - dissonance * 0.6),
    ruptureCorruption: clamp(ruptureState?.pressure ?? intent?.rupturePressure ?? 0),
    registerSpread: clamp(intent?.stereoWidth ?? 0.25),
  };
}
