// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Visual Mapping Patterns
//  Each channel has independent behavior that changes rarely.
// ═══════════════════════════════════════════════════════════

// ── Per-role behavior options ──
// size values increased for visibility; scene.midiScale further scales them

const KICK_BEHAVIORS = [
  { zone: [0.50, 0.90], xMode: 'center', shape: 'pulse',  size: 0.14, decay: 0.93, color: 0 },
  { zone: [0.40, 1.00], xMode: 'spread', shape: 'pulse',  size: 0.18, decay: 0.91, color: 0 },
  { zone: [0.30, 0.80], xMode: 'spread', shape: 'pulse',  size: 0.11, decay: 0.95, color: 0 },
];

const BASS_BEHAVIORS = [
  { zone: [0.65, 1.00], xMode: 'center', shape: 'blob',   size: 0.20, decay: 0.988, color: 1 },
  { zone: [0.45, 0.55], xMode: 'center', shape: 'blob',   size: 0.25, decay: 0.985, color: 1 },
  { zone: [0.50, 1.00], xMode: 'pitch',  shape: 'blob',   size: 0.18, decay: 0.986, color: 1 },
  { zone: [0.40, 0.90], xMode: 'center', shape: 'blob',   size: 0.22, decay: 0.990, color: 1 },
];

const HARMONY_BEHAVIORS = [
  { zone: [0.25, 0.75], xMode: 'pitch',  shape: 'band',   size: 0.12, decay: 0.978, color: 2 },
  { zone: [0.20, 0.80], xMode: 'stereo', shape: 'band',   size: 0.15, decay: 0.975, color: 2 },
  { zone: [0.10, 0.90], xMode: 'center', shape: 'blob',   size: 0.18, decay: 0.982, color: 2 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band',   size: 0.10, decay: 0.976, color: 2 },
];

const LEAD_BEHAVIORS = [
  { zone: [0.00, 0.40], xMode: 'pitch',  shape: 'trail',  size: 0.08, decay: 0.970, color: 3 },
  { zone: [0.10, 0.90], xMode: 'stereo', shape: 'trail',  size: 0.07, decay: 0.968, color: 3 },
  { zone: [0.00, 0.60], xMode: 'pitch',  shape: 'trail',  size: 0.10, decay: 0.975, color: 3 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'trail',  size: 0.06, decay: 0.965, color: 3 },
];

const TEXTURE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.04, decay: 0.955, color: 4 },
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.06, decay: 0.960, color: 4 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.05, decay: 0.950, color: null },
];

const ALL_BEHAVIORS = [KICK_BEHAVIORS, BASS_BEHAVIORS, HARMONY_BEHAVIORS, LEAD_BEHAVIORS, TEXTURE_BEHAVIORS];

// ── Current state ──
const channelMapping = [];
const channelChangeBar = [];

function pickBehavior(ch) {
  const pool = ALL_BEHAVIORS[ch];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function initMidiPatterns() {
  for (let i = 0; i < 5; i++) {
    channelMapping[i] = pickBehavior(i);
    channelChangeBar[i] = 8 + Math.floor(Math.random() * 24);
  }
}

export function checkPatternChange(barNum, ch) {
  if (barNum >= channelChangeBar[ch]) {
    const old = channelMapping[ch];
    channelMapping[ch] = pickBehavior(ch);
    channelChangeBar[ch] = barNum + 12 + Math.floor(Math.random() * 20);
    return old !== channelMapping[ch];
  }
  return false;
}

export function mutateChannel(ch) {
  channelMapping[ch] = pickBehavior(ch);
}

export function getChannelMapping(ch) {
  if (ch >= 5) return null;
  return channelMapping[ch];
}

export function getNotePosition(ch, noteNorm, velNorm) {
  if (ch >= 5) return null;
  const role = channelMapping[ch];
  if (!role) return null;

  const zoneH = role.zone[1] - role.zone[0];

  let y;
  if (role.shape === 'pulse' || role.xMode === 'center') {
    y = role.zone[0] + zoneH * 0.5;
  } else {
    y = role.zone[1] - noteNorm * zoneH;
  }

  let x;
  if (role.xMode === 'pitch') {
    x = 0.1 + noteNorm * 0.8;
  } else if (role.xMode === 'center') {
    x = 0.5 + (Math.random() - 0.5) * 0.08;
  } else if (role.xMode === 'spread') {
    // Distribuisce i kick su 3 punti fissi separati per evitare il flash centrale
    const kickPos = [0.25, 0.5, 0.75];
    x = kickPos[Math.floor(Math.random() * kickPos.length)] + (Math.random() - 0.5) * 0.12;
  } else if (role.xMode === 'stereo') {
    x = 0.15 + noteNorm * 0.7;
  } else {
    x = Math.random();
  }

  return {
    x, y,
    radius: role.size * (0.7 + velNorm * 0.3),
    decay: role.decay,
    shape: role.shape,
    color: role.color,
    ch,
  };
}

initMidiPatterns();
