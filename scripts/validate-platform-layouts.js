import {
  generatePlatformLayout,
  validatePlatformLayout,
} from '../src/systems/platformLayout.js';

const runCount = 2000;
let passed = 0;
let failed = 0;
let fallbackCount = 0;

const failures = [];

for (let variantIndex = 0; variantIndex < runCount; variantIndex += 1) {
  const layout = generatePlatformLayout(variantIndex);
  const validation = validatePlatformLayout(layout.platforms);

  if (validation.ok) {
    passed += 1;
  } else {
    failed += 1;
    failures.push({ variantIndex, reason: validation.reason });
  }

  // Fallback uses known staircase shape and a fixed first elevated x=620.
  if (layout.platforms[1]?.x === 620 && layout.platforms[1]?.y === 440) {
    fallbackCount += 1;
  }
}

const passRate = ((passed / runCount) * 100).toFixed(2);
console.log(`Validated ${runCount} generated layouts`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass rate: ${passRate}%`);
console.log(`Fallback layouts used: ${fallbackCount}`);

if (failures.length) {
  console.log('First 10 failures:', failures.slice(0, 10));
  throw new Error('Platform layout validation failed');
}
