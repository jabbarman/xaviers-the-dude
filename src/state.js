// Centralized mutable game state to replace former globals.
// This preserves behavior while making references explicit and easier to maintain.

export const state = {
  debug: false,
  starsPerWave: 10, // actual number will be repeat + 1 due to Phaser group behavior
  lives: 3,
  score: 0,
  hiScore: 100,
  wave: 1,
  portalJump: false,
  gameOver: false,
  player: null,
  stars: null,
  bombs: null,
  platforms: null,
  cursors: null,
  scoreText: null,
  hiScoreText: null,
  waveText: null,
  livesText: null,
  music: null
};

// Initialize hiScore from localStorage and handle debug tweaks similar to previous behavior.
(function initializeState() {
  try {
    const stored = localStorage.getItem('hiScore');
    if (stored) {
      state.hiScore = parseInt(stored);
    }
  } catch (e) {
    // If localStorage isn't available, keep default
  }

  if (state.debug) {
    state.starsPerWave = 0;
    state.lives = 1;
    state.hiScore = 0;
    try {
      localStorage.setItem('hiScore', state.hiScore);
    } catch (e) {}
  }
})();
