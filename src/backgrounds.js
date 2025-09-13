// Centralized background ordering and future-proof music mapping for portal jumps
// sky is the initial background (SceneA / first run). After each portal jump,
// advance through the ordered list below and wrap around.

export const BACKGROUND_SEQUENCE = [
  'starrysky',
  'asteroidfield',
  'saturnsky',
  'deepspace_comets',
  'intergalactic_galaxy',
  'earthlike_spaceships',
  'alien_landscape'
];

// Helper: given a variantIndex (0-based count of portal jumps),
// return the background key for SceneB.
export function backgroundForVariant(variantIndex){
  if (variantIndex == null || variantIndex < 0) return 'sky';
  if (variantIndex === 0) return 'sky';
  const idx = (variantIndex - 1) % BACKGROUND_SEQUENCE.length;
  return BACKGROUND_SEQUENCE[idx] || 'sky';
}

// Music plan: placeholder mapping aligned with BACKGROUND_SEQUENCE order.
// This anticipates new tracks per background; default to an existing fallback.
export const MUSIC_FOR_BACKGROUND = {
  sky: 'iLoveMy8bit',
  starrysky: 'boden',
  asteroidfield: '8BitMusic',
  saturnsky: 'flat8bit',
  deepspace_comets: '8bitTheme',
  intergalactic_galaxy: 'pixelParadise',
  earthlike_spaceships: 'percussiveDubstep',
  alien_landscape: 'tommy'
};

export function musicForBackground(bgKey){
  return MUSIC_FOR_BACKGROUND[bgKey] || 'iLoveMy8bit';
}
