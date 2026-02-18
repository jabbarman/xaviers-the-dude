// Configuration constants for the game.
export const WIDTH = 800;
export const HEIGHT = 600;

// Physics and gameplay tunables (extracted from scenes/logic)
export const PLAYER_SPEED_X = 160;
export const PLAYER_JUMP_VELOCITY = -330;
export const PLAYER_BOUNCE = 0.2;

export const STAR_SCORE_BASE = 10; // multiplied by wave
export const STARS_BOUNCE_MIN = 0.4;
export const STARS_BOUNCE_MAX = 0.8;

export const BOMB_VELOCITY_MIN = -200;
export const BOMB_VELOCITY_MAX = 200;
export const BOMB_INITIAL_VY = 20;

export const EXTRA_BOMB_WAVE_BEFORE_PORTAL = 1; // waves before portal to spawn extra bomb
export const PORTAL_WAVE_INTERVAL = 5;
export const PORTAL_EXTRA_LIFE = 1;

export const GAME_OVER_TEXT = {
  x: 400,
  y: 300,
  fontSize: '64px',
  fill: '#000',
};

// Moving platform phase tuning.
export const MOVING_PLATFORM = {
  enabled: true,
  // Layout index to move: 0=ground, 1=first elevated, 2=second elevated, ...
  movingPlatformIndex: 2,
  mode: 'wrap', // supported: 'wrap', 'bounce'
  speedMin: 30,
  speedMax: 52,
  // Keep a little off-screen travel for cleaner wrap transitions.
  wrapBuffer: 10,
  // Fairness safeguard: keep nearby jumps conservative for the moving platform.
  conservativeJumpGap: 180,
};

// Mobile UI Constants
export const MOBILE_BUTTON_SIZE = 80;
export const MOBILE_BUTTON_MARGIN = 20;
export const MOBILE_BUTTON_OPACITY = 0.5;
export const MOBILE_BUTTON_COLOR = 0x888888;
