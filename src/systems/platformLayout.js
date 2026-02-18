import {
  WIDTH,
  HEIGHT,
  PLAYER_JUMP_VELOCITY,
  PLAYER_SPEED_X,
  MOVING_PLATFORM,
} from '../config.js';

const PLATFORM_WIDTH = 400;
const PLATFORM_HEIGHT = 32;
const GROUND_Y = 568;
const ELEVATED_PLATFORM_COUNT = 4;

// Keep generation deterministic within a run, but vary between runs/reloads.
const DEFAULT_SEED = 0xc0ffee;
const MAX_GENERATION_ATTEMPTS = 140;

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

// Player-space traversability constraints (gameplay-first anti-trap tuning).
const PLAYER_BODY_WIDTH = 32; // from dude frameWidth (default Arcade body width)
const PLAYER_BODY_HEIGHT = 48; // from dude frameHeight (default Arcade body height)
const PLAYER_HALF_WIDTH = PLAYER_BODY_WIDTH / 2;
const MIN_TRAVERSAL_GAP = PLAYER_BODY_WIDTH + 32; // 64px hard minimum for reliable traversal

const SLOT_DY_MIN = PLAYER_BODY_HEIGHT + 8;
const SLOT_DY_MAX = MAX_UPWARD_RISE - 20;
const SLOT_MIN_OVERLAP = 220;
const SLOT_MAX_CENTER_OFFSET = 96;

// Strict side-approach anti-choke checks for elevated platforms.
const SIDE_APPROACH_DEPTH = PLAYER_BODY_WIDTH + 108; // wider lane probe to catch near-adjacent choke geometry
const SIDE_APPROACH_EDGE_BUFFER = PLAYER_HALF_WIDTH + 8;
const SIDE_SCAN_ABOVE = 180;
const SIDE_SCAN_BELOW = 180;


// Keep elevated platforms away from screen edges so the player can always approach from either side.
const EDGE_ENTRY_MARGIN = PLAYER_BODY_WIDTH; // at least one sprite width clearance to the screen edge
const X_MIN = PLATFORM_WIDTH / 2 + EDGE_ENTRY_MARGIN;
const X_MAX = WIDTH - PLATFORM_WIDTH / 2 - EDGE_ENTRY_MARGIN;
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

function overlapX(source, target) {
  const a = platformRect(source);
  const b = platformRect(target);
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
}

function maxReachableEdgeGapForRise(rise) {
  if (rise <= 0) return MAX_EDGE_GAP_FLAT;
  const t = clamp(rise / MAX_UPWARD_RISE, 0, 1);
  return Math.floor(
    MAX_EDGE_GAP_FLAT - (MAX_EDGE_GAP_FLAT - MAX_EDGE_GAP_AT_MAX_RISE) * t,
  );
}

function findNarrowCorridor(platforms) {
  for (let i = 0; i < platforms.length; i += 1) {
    for (let j = i + 1; j < platforms.length; j += 1) {
      const a = platforms[i];
      const b = platforms[j];
      const dy = Math.abs(a.y - b.y);

      const gap = edgeGap(a, b);
      if (gap > 0 && gap < MIN_TRAVERSAL_GAP) {
        return { i, j, gap, dy };
      }
    }
  }
  return null;
}

function findVerticalSlotTrap(platforms) {
  for (let i = 0; i < platforms.length; i += 1) {
    for (let j = i + 1; j < platforms.length; j += 1) {
      const a = platforms[i];
      const b = platforms[j];
      const dy = Math.abs(a.y - b.y);
      if (dy < SLOT_DY_MIN || dy > SLOT_DY_MAX) continue;

      const shared = overlapX(a, b);
      if (shared < SLOT_MIN_OVERLAP) continue;

      const dx = Math.abs(a.x - b.x);
      if (dx <= SLOT_MAX_CENTER_OFFSET) {
        return { i, j, dy, shared, dx };
      }
    }
  }
  return null;
}

function sideCorridorRange(platform, side) {
  const rect = platformRect(platform);
  if (side === 'left') {
    return {
      left: rect.left - SIDE_APPROACH_DEPTH,
      right: rect.left + SIDE_APPROACH_EDGE_BUFFER,
    };
  }

  return {
    left: rect.right - SIDE_APPROACH_EDGE_BUFFER,
    right: rect.right + SIDE_APPROACH_DEPTH,
  };
}

function hasHorizontalOverlap(range, platform) {
  const rect = platformRect(platform);
  return rect.right > range.left && rect.left < range.right;
}

function findSideApproachTrap(platforms) {
  for (let i = 0; i < platforms.length; i += 1) {
    const platform = platforms[i];
    for (const side of ['left', 'right']) {
      const range = sideCorridorRange(platform, side);
      let blockedAbove = false;
      let blockedBelow = false;

      for (let j = 0; j < platforms.length; j += 1) {
        if (i === j) continue;
        const neighbor = platforms[j];
        if (!hasHorizontalOverlap(range, neighbor)) continue;

        const dy = neighbor.y - platform.y;
        if (dy < 0 && Math.abs(dy) <= SIDE_SCAN_ABOVE) blockedAbove = true;
        if (dy > 0 && dy <= SIDE_SCAN_BELOW) blockedBelow = true;

        if (blockedAbove && blockedBelow) {
          return {
            i,
            side,
            above: SIDE_SCAN_ABOVE,
            below: SIDE_SCAN_BELOW,
          };
        }
      }
    }
  }

  return null;
}

function adjustCandidateAgainst(platform, candidate) {
  const source = { ...candidate };
  const gap = edgeGap(platform, source);
  if (gap > 0 && gap < MIN_TRAVERSAL_GAP) {
    const shift = MIN_TRAVERSAL_GAP - gap;
    const direction = source.x >= platform.x ? 1 : -1;
    source.x = clamp(source.x + direction * shift, X_MIN, X_MAX);
  }

  const overlap = overlapX(platform, source);
  const slotDy = Math.abs(platform.y - source.y);
  const centerDx = Math.abs(platform.x - source.x);
  if (
    slotDy >= SLOT_DY_MIN &&
    slotDy <= SLOT_DY_MAX &&
    overlap >= SLOT_MIN_OVERLAP &&
    centerDx <= SLOT_MAX_CENTER_OFFSET
  ) {
    const stagger = SLOT_MAX_CENTER_OFFSET - centerDx + PLAYER_HALF_WIDTH;
    const direction = source.x >= platform.x ? 1 : -1;
    source.x = clamp(source.x + direction * stagger, X_MIN, X_MAX);
  }

  return source;
}

function hasConservativePathForMovingPlatform(platforms) {
  if (!MOVING_PLATFORM.enabled) return true;

  const movingIndices = Array.isArray(MOVING_PLATFORM.movingPlatformIndexes)
    ? MOVING_PLATFORM.movingPlatformIndexes
    : [MOVING_PLATFORM.movingPlatformIndex];

  const conservativeGap = MOVING_PLATFORM.conservativeJumpGap;

  for (const movingIndex of movingIndices) {
    if (!Number.isInteger(movingIndex) || movingIndex <= 0) continue;
    const moving = platforms[movingIndex];
    if (!moving) continue;

    let hasNearbyPath = false;
    for (let i = 0; i < platforms.length; i += 1) {
      if (i === movingIndex) continue;
      const other = platforms[i];
      const gap = edgeGap(moving, other);
      const dy = Math.abs(other.y - moving.y);
      if (gap > conservativeGap) continue;

      // Require at least one practical connection near each moving platform.
      if (dy <= MAX_UPWARD_RISE && (canJumpBetween(other, moving) || canJumpBetween(moving, other))) {
        hasNearbyPath = true;
        break;
      }
    }

    if (!hasNearbyPath) return false;
  }

  return true;
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

  const narrowCorridor = findNarrowCorridor(platforms.slice(1));
  if (narrowCorridor) {
    return {
      ok: false,
      reason: `narrow corridor between platforms ${narrowCorridor.i}/${narrowCorridor.j} (gap=${narrowCorridor.gap})`,
    };
  }

  const slotTrap = findVerticalSlotTrap(platforms.slice(1));
  if (slotTrap) {
    return {
      ok: false,
      reason: `vertical slot trap between platforms ${slotTrap.i}/${slotTrap.j} (dy=${slotTrap.dy}, overlap=${slotTrap.shared})`,
    };
  }

  const elevated = platforms.slice(1);
  const sideApproachTrap = findSideApproachTrap(elevated);
  if (sideApproachTrap) {
    return {
      ok: false,
      reason: `blocked ${sideApproachTrap.side} approach on elevated platform ${sideApproachTrap.i} (above<=${sideApproachTrap.above}, below<=${sideApproachTrap.below})`,
    };
  }
  if (!hasConservativePathForMovingPlatform(platforms)) {
    return {
      ok: false,
      reason: 'moving platform lacks conservative nearby jump path',
    };
  }

  const highest = elevated.reduce(
    (min, p) => (p.y < min.y ? p : min),
    elevated[0],
  );
  if (!highest || highest.y > HEIGHT * 0.45) {
    return { ok: false, reason: 'not enough vertical coverage for stars' };
  }

  return { ok: true };
}

export function generatePlatformLayout(variantIndex = 0, runSeed = DEFAULT_SEED) {
  const baseSeed = Number.isFinite(runSeed) ? (runSeed >>> 0) : DEFAULT_SEED;
  const seed = ((variantIndex + 1) * 0x9e3779b1) ^ baseSeed;
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
      let candidate = {
        x: clamp(
          proposedX + spreadBoost * Math.floor((rng() * 2 - 1) * 90),
          X_MIN,
          X_MAX,
        ),
        y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      };

      // Pre-emptively avoid tiny corridors and near-overlap slot traps.
      for (let pass = 0; pass < 2; pass += 1) {
        for (let j = 1; j < platforms.length; j += 1) {
          candidate = adjustCandidateAgainst(platforms[j], candidate);
        }
      }

      platforms.push(candidate);
      anchorX = candidate.x;
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
          playerBodyWidth: PLAYER_BODY_WIDTH,
          playerBodyHeight: PLAYER_BODY_HEIGHT,
          minTraversalGap: MIN_TRAVERSAL_GAP,
          slotDyMin: SLOT_DY_MIN,
          slotDyMax: SLOT_DY_MAX,
          slotMinOverlap: SLOT_MIN_OVERLAP,
          slotMaxCenterOffset: SLOT_MAX_CENTER_OFFSET,
          sideApproachDepth: SIDE_APPROACH_DEPTH,
          sideApproachEdgeBuffer: SIDE_APPROACH_EDGE_BUFFER,
          sideScanAbove: SIDE_SCAN_ABOVE,
          sideScanBelow: SIDE_SCAN_BELOW,
          movingPlatformConservativeJumpGap: MOVING_PLATFORM.conservativeJumpGap,
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
        x: 555,
        y: 440,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 439,
        y: 350,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 338,
        y: 270,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        scaleX: 1,
      },
      {
        x: 241,
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
      playerBodyWidth: PLAYER_BODY_WIDTH,
      playerBodyHeight: PLAYER_BODY_HEIGHT,
      minTraversalGap: MIN_TRAVERSAL_GAP,
      slotDyMin: SLOT_DY_MIN,
      slotDyMax: SLOT_DY_MAX,
      slotMinOverlap: SLOT_MIN_OVERLAP,
      slotMaxCenterOffset: SLOT_MAX_CENTER_OFFSET,
      sideApproachDepth: SIDE_APPROACH_DEPTH,
      sideApproachEdgeBuffer: SIDE_APPROACH_EDGE_BUFFER,
      sideScanAbove: SIDE_SCAN_ABOVE,
      sideScanBelow: SIDE_SCAN_BELOW,
      movingPlatformConservativeJumpGap: MOVING_PLATFORM.conservativeJumpGap,
    },
  };
}
