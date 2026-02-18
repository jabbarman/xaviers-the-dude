import { MOVING_PLATFORM } from '../src/config.js';
import { movingPlatformVelocity } from '../src/systems/movingPlatform.js';

const samples = 2000;
let minSeen = Number.POSITIVE_INFINITY;
let maxSeen = 0;

for (let i = 0; i < samples; i += 1) {
  const speed = Math.abs(movingPlatformVelocity(0xc0ffee + i, i % 37));
  minSeen = Math.min(minSeen, speed);
  maxSeen = Math.max(maxSeen, speed);

  if (speed < MOVING_PLATFORM.speedMin || speed > MOVING_PLATFORM.speedMax) {
    throw new Error(`speed out of range: ${speed}`);
  }

  const stable = movingPlatformVelocity(12345, 6);
  const stableAgain = movingPlatformVelocity(12345, 6);
  if (stable !== stableAgain) {
    throw new Error('moving platform speed is not deterministic per run');
  }
}

console.warn(
  `PASS: moving platform deterministic speed in range (${minSeen}-${maxSeen} px/s)`,
);
