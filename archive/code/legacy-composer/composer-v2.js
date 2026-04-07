import { createComposerState, tickComposer } from './composer-core.js';
import { createDirectorIntent } from './director-intent.js';
import { createRuptureState, updateRuptureState } from './rupture-director.js';
import { buildComposerDirectives } from './composer-bridge.js';

const composer = {
  state: null,
  rupture: null,
  intent: null,
  directives: null,
  lastNowSec: 0,
};

export function initComposer() {
  composer.state = createComposerState();
  composer.rupture = createRuptureState();
  composer.intent = null;
  composer.directives = null;
  composer.lastNowSec = 0;
  return composer;
}

export function updateComposer({ state, arc, globalTimeSec = 0 }) {
  if (!composer.state) initComposer();
  composer.intent = createDirectorIntent(state, arc, composer.state, globalTimeSec);
  updateRuptureState(composer.rupture, composer.intent, globalTimeSec);
  composer.directives = buildComposerDirectives(composer.intent, arc, composer.rupture);
  const events = tickComposer(composer.state, {
    ...composer.intent,
    ...composer.directives,
    composerPhase: composer.directives.phase,
    rupturePressure: composer.rupture.pressure,
  }, globalTimeSec);
  composer.lastNowSec = globalTimeSec;
  return events;
}

export function getComposerState() {
  return composer;
}
