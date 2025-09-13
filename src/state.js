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
  variantIndex: 0, // increments after each portal jump to alter SceneB variation
  player: null,
  stars: null,
  bombs: null,
  platforms: null,
  cursors: null,
  scoreText: null,
  hiScoreText: null,
  waveText: null,
  livesText: null,
  music: null,
  /**
   * Reset transient runtime state to defaults without touching persisted values
   * such as hiScore and highScores. Use when starting a new run or after
   * submitting a high score.
   */
  reset() {
    this.debug = false;
    this.starsPerWave = 10;
    this.lives = 3;
    this.score = 0;
    // hiScore is preserved
    this.wave = 1;
    this.portalJump = false;
    this.gameOver = false;
    this.variantIndex = 0;
    // Clear runtime references to allow GC between runs
    this.player = null;
    this.stars = null;
    this.bombs = null;
    this.platforms = null;
    this.cursors = null;
    this.scoreText = null;
    this.hiScoreText = null;
    this.waveText = null;
    this.livesText = null;
    // Stop and clear music handle if still active
    try { this.music?.stop?.(); } catch(e) {}
    this.music = null;
  }
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
