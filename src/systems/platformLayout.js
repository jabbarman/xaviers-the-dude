import {
  WIDTH,
  HEIGHT,
  PLAYER_JUMP_VELOCITY,
  PLAYER_SPEED_X,
} from '../config.js';

const PLATFORM_WIDTH = 400;
const PLATFORM_HEIGHT = 32;
const GROUND_Y = 568;
const ELEVATED_PLATFORM_COUNT = 4;

// Keep generation deterministic per level variant for easier debugging/replays.
const DEFAULT_SEED = 0xc0ffee;
const MAX_GENERATION_ATTEMPTS = 60;

// Physics-derived envelope + safety margins.
const GRAVITY_Y = 300;
const JUMP_RISE_THEORETICAL =
  (Math.abs(PLAYER_JUMP_VELOCITY) * Math.abs(PLAYER_JUMP_VELOCITY)) /
  (2 * GRAVITY_Y);
const MAX_UPWARD_RISE = Math.floor(JUMP_RISE_THEORETICAL - 32); // ~149
const MAX_DROP = 320;
const MAX_EDGE_GAP_FLAT = 220;
const MAX_EDGE_GAP_AT_MAX_RISE = 120;
const MAX_EDGE_GAP_DOWNWARD = 260;

const X_MIN = PLATFORM_WIDTH / 2;
const X_MAX = WIDTH - PLATFORM_WIDTH / 2;
const Y_BANDS = [
  { base: 460, jitter: 22 },
  { base: 370, jitter: 28 },
  { base: 285, jitter: 32 },
  { base: 200, jitter: 24 },
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function platformRect(platform) {
  const half = platform.width / 2;
  return {
    left: platform.x - half,
    right: platform.x + half,
    top: platform.y - platform.height / 2,
  };
}

function edgeGap(source, target) {
  const a = platformRect(source);
  const b = platformRect(target);
  if (a.right < b.left) return b.left - a.right;
  if (b.right < a.left) return a.left - b.right;
  return 0;
}

function maxReachableEdgeGapForRise(rise) {
  if (rise <= 0) return MAX_EDGE_GAP_FLAT;
  const t = clamp(rise / MAX_UPWARD_RISE, 0, 1);
  return Math.floor(
    MAX_EDGE_GAP_FLAT - (MAX_EDGE_GAP_FLAT - MAX_EDGE_GAP_AT_MAX_RISE) * t,
  );
}

export function canJumpBetween(source, target) {
  const s = platformRect(source);
  const t = platformRect(target);
  const rise = s.top - t.top;

  if (rise > MAX_UPWARD_RISE) return false;
  if (rise < -MAX_DROP) return false;

  const gap = edgeGap(source, target);
  if (rise <= 0) {
    return gap <= MAX_EDGE_GAP_DOWNWARD;
  }

  return gap <= maxReachableEdgeGapForRise(rise);
}

export function validatePlatformLayout(platforms) {
  if (!Array.isArray(platforms) || platforms.length < 2) {
    return { ok: false, reason: 'platforms list is empty' };
  }

  const visited = new Set([0]);
  const queue = [0];

  while (queue.length) {
    const current = queue.shift();
    for (let i = 0; i < platforms.length; i += 1) {
      if (visited.has(i)) continue;
      if (canJumpBetween(platforms[current], platforms[i])) {
        visited.add(i);
        queue.push(i);
      }
    }
  }

  if (visited.size !== platforms.length) {
    return {
      ok: false,
      reason: `unreachable platforms: ${platforms.length - visited.size}`,
    };
  }

  const elevated = platforms.slice(1);
  const highest = elevated.reduce(
    (min, p) => (p.y < min.y ? p : min),
    elevated[0],
  );
  if (!highest || highest.y > HEIGHT * 0.45) {
    return { ok: false, reason: 'not enough vertical coverage for stars' };
  }

  return { ok: true };
}

export function generatePlatformLayout(variantIndex = 0) {
  const seed = ((variantIndex + 1) * 0x9e3779b1) ^ DEFAULT_SEED;
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const platforms = [
      {
        x: WIDTH / 2,
        y: GROUND_Y,
        width: WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 2,
      },
    ];

    let anchorX = 120 + Math.floor(rng() * 120);

    for (let i = 0; i < ELEVATED_PLATFORM_COUNT; i += 1) {
      const band = Y_BANDS[i % Y_BANDS.length];
      const y = band.base + Math.floor((rng() * 2 - 1) * band.jitter);

      const drift = Math.floor((rng() * 2 - 1) * 260);
      const proposedX = clamp(anchorX + drift, X_MIN, X_MAX);
      const spreadBoost = i % 2 === 0 ? -1 : 1;
      const x = clamp(
        proposedX + spreadBoost * Math.floor((rng() * 2 - 1) * 90),
        X_MIN,
        X_MAX,
      );

      platforms.push({
        x,
        y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      });
      anchorX = x;
    }

    const validation = validatePlatformLayout(platforms);
    if (validation.ok) {
      return {
        seed,
        platforms,
        tuning: {
          maxUpwardRise: MAX_UPWARD_RISE,
          maxDrop: MAX_DROP,
          maxEdgeGapFlat: MAX_EDGE_GAP_FLAT,
          maxEdgeGapMaxRise: MAX_EDGE_GAP_AT_MAX_RISE,
          maxEdgeGapDownward: MAX_EDGE_GAP_DOWNWARD,
          theoreticalRise: Math.floor(JUMP_RISE_THEORETICAL),
          playerSpeedX: PLAYER_SPEED_X,
        },
      };
    }
  }

  // Guaranteed fallback if random attempts failed: legacy-safe staircase.
  return {
    seed,
    platforms: [
      {
        x: WIDTH / 2,
        y: GROUND_Y,
        width: WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 2,
      },
      {
        x: 620,
        y: 440,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 300,
        y: 350,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 520,
        y: 270,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 220,
        y: 190,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
    ],
    tuning: {
      maxUpwardRise: MAX_UPWARD_RISE,
      maxDrop: MAX_DROP,
      maxEdgeGapFlat: MAX_EDGE_GAP_FLAT,
      maxEdgeGapMaxRise: MAX_EDGE_GAP_AT_MAX_RISE,
      maxEdgeGapDownward: MAX_EDGE_GAP_DOWNWARD,
      theoreticalRise: Math.floor(JUMP_RISE_THEORETICAL),
      playerSpeedX: PLAYER_SPEED_X,
    },
  };
}
