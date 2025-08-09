// Entry point: builds Phaser.Game with modular scenes.
// Phaser is loaded globally via script tag in index.html.

import { WIDTH, HEIGHT } from './config.js';
import { SceneA } from './scenes/SceneA.js';
import { SceneB } from './scenes/SceneB.js';
import { SceneC } from './scenes/SceneC.js';
import { SceneD } from './scenes/SceneD.js';

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'phaser-example',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT
  },
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [SceneA, SceneB, SceneC, SceneD]
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
