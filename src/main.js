// Entry point: builds Phaser.Game with modular scenes.
// Phaser is loaded globally via script tag in index.html.

import { WIDTH, HEIGHT } from './config.js';
import { SceneA } from './scenes/SceneA.js';
import { SceneB } from './scenes/SceneB.js';
import { SceneC } from './scenes/SceneC.js';
import { SceneHighScore } from './scenes/SceneHighScore.js';
import { Preloader } from './scenes/Preloader.js';
import { UIScene } from './scenes/UIScene.js';
import { PostFXScene } from './scenes/PostFXScene.js';
import { PortalScene } from './scenes/PortalScene.js';
import { backgroundForVariant } from './backgrounds.js';

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
  render: { pixelArt: true, roundPixels: true },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [Preloader, SceneA, SceneB, SceneC, SceneHighScore, UIScene, PostFXScene, PortalScene],
};

// Attach tooling hook for background variants
config.backgroundForVariant = backgroundForVariant;

// eslint-disable-next-line no-new
new Phaser.Game(config);
