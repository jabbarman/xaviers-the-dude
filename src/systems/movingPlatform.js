import { WIDTH, MOVING_PLATFORM } from '../config.js';

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function movingPlatformVelocity(layoutSeed, variantIndex) {
  const seed = ((layoutSeed >>> 0) ^ ((variantIndex + 1) * 0x9e3779b1)) >>> 0;
  const rng = mulberry32(seed ^ 0xa511e9b3);
  const speedSpan = MOVING_PLATFORM.speedMax - MOVING_PLATFORM.speedMin;
  const speed = MOVING_PLATFORM.speedMin + Math.round(rng() * speedSpan);
  const direction = rng() > 0.5 ? 1 : -1;
  return speed * direction;
}

export function advanceMovingPlatform(platform, deltaMs) {
  if (!platform?.active || !platform?.movingSpec) return;
  const dt = Math.max(0, deltaMs || 0) / 1000;
  if (dt <= 0) return;

  const spec = platform.movingSpec;
  platform.x += spec.velocityX * dt;

  if (spec.mode === 'bounce') {
    const halfWidth = spec.width / 2;
    const minX = halfWidth;
    const maxX = WIDTH - halfWidth;
    if (platform.x <= minX || platform.x >= maxX) {
      platform.x = Phaser.Math.Clamp(platform.x, minX, maxX);
      spec.velocityX *= -1;
    }
  } else {
    const halfWidth = spec.width / 2;
    const wrapBuffer = spec.wrapBuffer || 0;
    const leftThreshold = -halfWidth - wrapBuffer;
    const rightThreshold = WIDTH + halfWidth + wrapBuffer;
    if (platform.x > rightThreshold) {
      platform.x = leftThreshold;
    } else if (platform.x < leftThreshold) {
      platform.x = rightThreshold;
    }
  }

  platform.body.updateFromGameObject();
}
