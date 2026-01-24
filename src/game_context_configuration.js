// junie.config.mjs
// Centralized game context for automation/integration tools (e.g., Junie).
// Purpose: Provide a structured, discoverable description of the game's
// runtime, scenes, state, assets, inputs, and persistence, without altering game logic.

import { WIDTH, HEIGHT } from './config.js';

const config = {
  meta: {
    name: 'Phaser Game',
    engine: { name: 'phaser', version: '3.90.0' },
    description: 'Configuration for Junie to understand the game context.',
  },

  runtime: {
    size: { width: WIDTH, height: HEIGHT },
    // If your Phaser setup uses scale configs, they can be noted here for tools.
    scale: {
      mode: 'FIT', // descriptive; tool-facing (does not modify the game)
      autoCenter: 'BOTH',
      pixelArt: true,
    },
    // Optional hook names your game may expose on game.config
    hooks: {
      // If present on this.sys.game.config: (variantIndex:number)=>backgroundKey:string
      backgroundForVariant: 'backgroundForVariant',
    },
  },

  // File discovery hints. Tools should use these globs to locate modules.
  files: {
    scenes: [
      { id: 'SceneA', find: ['**/SceneA.js'] },
      { id: 'SceneB', find: ['**/SceneB.js'] },
      { id: 'SceneHighScore', find: ['**/SceneHighScore.js'] },
      // Referenced/overlay scenes that may exist in the project:
      { id: 'UIScene', find: ['**/UIScene.js'], optional: true },
      { id: 'PortalScene', find: ['**/PortalScene.js'], optional: true },
      { id: 'SceneC', find: ['**/SceneC.js'], optional: true },
    ],
    state: { find: ['**/state.js'] },
    config: { find: ['**/config.js'] },
    logic: { find: ['**/logic.js'], optional: true },
    backgrounds: { find: ['**/backgrounds.js'], optional: true },
    theme: { find: ['**/theme.js'], optional: true },
    entryPoints: {
      // Tools can scan these to infer bootstrapping
      html: ['**/index.html'],
      js: ['**/main.js', '**/index.js', '**/game.js'],
    },
  },

  // High-level scene graph and transitions to help tools script flows and tests
  flow: {
    startScene: 'SceneA',
    transitions: [
      { from: 'SceneA', on: 'pointerup', to: 'SceneB' },
      { from: 'SceneB', on: 'gameOver', to: 'SceneC', optional: true },
      {
        from: 'SceneB',
        on: 'portalJump',
        to: 'SceneB',
        note: 'increments variantIndex via PortalScene',
      },
      { from: 'SceneB', overlay: ['UIScene'] },
      { from: 'SceneHighScore', overlayStop: ['UIScene'] },
    ],
  },

  // Central state shape (for tools to read/write/inspect during automation)
  state: {
    module: { find: ['**/state.js'] },
    keys: [
      'debug',
      'starsPerWave',
      'lives',
      'score',
      'hiScore',
      'wave',
      'portalJump',
      'gameOver',
      'variantIndex',
      // runtime-assigned references
      'player',
      'stars',
      'bombs',
      'platforms',
      'music',
    ],
    persistence: {
      localStorage: [
        { key: 'hiScore', usedBy: 'state' },
        { key: 'highScores', usedBy: 'SceneHighScore' },
      ],
    },
    events: {
      // Emitted on the global game event bus to update HUD and wave info
      emitters: [
        'hud:lives',
        'hud:score',
        'hud:hiscore',
        'hud:wave',
        'wave:start',
        'hud:mute',
      ],
    },
  },

  // Inputs that tools may simulate
  input: {
    pointer: ['pointerup'],
    keyboard: [
      { key: 'LEFT' },
      { key: 'RIGHT' },
      { key: 'UP' },
      { key: 'F', description: 'Toggle fullscreen in SceneB' },
      { key: 'M', description: 'Toggle mute' },
      { key: 'ENTER', context: 'SceneHighScore' },
      { key: 'SPACE', context: 'SceneHighScore' },
      { key: 'ARROWS', context: 'SceneHighScore navigation' },
    ],
  },

  // Known asset keys and their typical usage; helps tools preload/verify
  assets: {
    images: [
      { key: 'background_image', context: 'SceneA' },
      { key: 'sky', context: 'SceneB background', optional: true },
      { key: 'alien_landscape', context: 'SceneB background', optional: true },
      { key: 'ground', context: 'SceneB platforms', optional: true },
      { key: 'ground_space', context: 'SceneB platforms', optional: true },
      { key: 'ground_alien', context: 'SceneB platforms', optional: true },
      { key: 'fullscreen', context: 'SceneB UI', optional: true },
      { key: 'rub', context: 'SceneHighScore', optional: true },
      { key: 'end', context: 'SceneHighScore', optional: true },
      { key: 'block', context: 'SceneHighScore', optional: true },
    ],
    spritesheets: [
      {
        key: 'dude',
        context: 'SceneB player',
        frames: { groups: ['left', 'turn', 'right'] },
      },
      { key: 'star', context: 'SceneB collectibles' },
    ],
    audio: [
      { key: 'gameOver', context: 'SceneB' },
      { key: 'ping', context: 'SceneB' },
      { key: 'explode', context: 'SceneB' },
      { key: 'portalJump', context: 'SceneB' },
      { key: 'boden', context: 'Background music', optional: true },
      { key: 'tommy', context: 'Background music', optional: true },
      { key: 'iLoveMy8bit', context: 'Background music', optional: true },
      { key: '8BitMusic', context: 'Background music', optional: true },
      { key: 'flat8bit', context: 'Background music', optional: true },
      { key: '8bitTheme', context: 'Background music', optional: true },
      { key: 'percussiveDubstep', context: 'Background music', optional: true },
      { key: 'pixelParadise', context: 'Background music', optional: true },
    ],
    bitmapFonts: [{ key: 'arcade', context: 'SceneHighScore' }],
    // Mappings/hooks that tools might need to invoke
    dynamic: {
      // If backgrounds.js provides helper(s) these are their intended roles:
      // musicForBackground(bgKey:string) => musicKey:string
      helpers: [{ module: 'backgrounds', functions: ['musicForBackground'] }],
    },
  },

  // Gameplay-relevant knobs helping tools craft scenarios
  gameplay: {
    sceneB: {
      platformsVariantRule: 'variantIndex % 2 toggles layout',
      stars: {
        countKey: 'starsPerWave',
        distribution: 'even across width using WIDTH/(count+1)',
      },
      movement: {
        leftVelocity: -160,
        rightVelocity: 160,
        jumpVelocity: -330,
      },
      fullscreenToggle: {
        key: 'F',
        buttonKey: 'fullscreen',
      },
      portal: {
        triggerFlag: 'portalJump',
        lifeReward: 1,
        clears: ['bombs'],
        transitionsVia: 'PortalScene',
      },
    },
  },

  // Conventions and expectations for tools, without enforcing runtime changes
  conventions: {
    codingStyle: 'ES modules',
    assetKeying: 'string keys per Phaser cache',
    sceneKeys: 'Phaser.Scene keys match constructor super(...) string',
  },
};

export default config;

