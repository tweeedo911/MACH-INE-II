import { audio } from './audio.js';

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

export function createDirectorIntent(state, arc, composerState, globalTimeSec = 0) {
  const intensity = clamp(state?.intensity ?? 0);
  const rhythmicity = clamp(state?.rhythmicity ?? 0);
  const brightness = clamp(state?.brightness ?? 0);
  const stereoWidth = clamp(state?.stereoWidth ?? 0);
  const tension = clamp(intensity * 0.35 + clamp(audio.flux * 18) * 0.35 + (1 - rhythmicity) * 0.15 + brightness * 0.15);
  const voidness = clamp((1 - intensity) * 0.65 + (state?.trajectory === -1 ? 0.2 : 0) + (rhythmicity < 0.2 ? 0.15 : 0));
  const arcProgress = clamp((arc?.phaseTime ?? 0) / 90);
  const memoryResidue = clamp((composerState?.memoryResidue ?? 0) * 0.7 + (arc?.phase === 'DECAY' ? 0.35 : 0) + (arc?.phase === 'PEAK' ? 0.1 : 0));
  const afterHalfBias = clamp((globalTimeSec - 120) / 180);
  const rupturePressure = clamp(lerp(afterHalfBias, tension, 0.55) + (arc?.phase === 'INTENSE' ? 0.18 : 0) + (arc?.phase === 'PEAK' ? 0.32 : 0));
  return {
    phase: arc?.phase || 'ACTIVE',
    composerPhase: composerState?.phase,
    arcProgress,
    intensity,
    rhythmicity,
    brightness,
    stereoWidth,
    tension,
    voidness,
    memoryResidue,
    rupturePressure,
    cameraBias: {
      widen: clamp(voidness * 0.8 + stereoWidth * 0.2),
      tighten: clamp(tension * 0.55 + intensity * 0.45),
      drift: clamp((1 - rhythmicity) * 0.4 + brightness * 0.2 + stereoWidth * 0.4),
    },
    sceneBias: {
      sparse: clamp(voidness * 0.85 + (arc?.phase === 'SILENCE' ? 0.2 : 0)),
      dense: clamp(intensity * 0.75 + tension * 0.25),
      negative: clamp(tension * 0.7 + memoryResidue * 0.3),
      horizon: clamp(brightness * 0.55 + stereoWidth * 0.45),
    },
    composerBias: {
      density: intensity,
      silence: voidness,
      dissonance: tension,
      spread: stereoWidth,
    },
  };
}
