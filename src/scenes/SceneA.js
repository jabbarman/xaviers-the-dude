import { addTitle, addBig } from '../theme.js';
import { state } from '../state.js';
import { VERSION } from '../version.js';
import { WIDTH, HEIGHT } from '../config.js';

export class SceneA extends Phaser.Scene {
  constructor() {
    super('SceneA');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);

    // Center the titles
    addTitle(this, WIDTH / 2, 200, 'XAVIER').setOrigin(0.5);
    addTitle(this, WIDTH / 2, 250, 'THE DUDE').setOrigin(0.5);

    // Start Game Button
    const startBtn = addBig(this, WIDTH / 2, 350, 'START GAME')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerup', () => {
      try {
        state.reset();
      } catch (e) { console.warn('Error during state reset in SceneA:', e); }
      this.scene.start('SceneB', { variantIndex: 0 });
    });

    // High Scores Button
    const scoresBtn = addBig(this, WIDTH / 2, 410, 'HI SCORES')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    scoresBtn.on('pointerup', () => {
      this.scene.start('SceneHighScore');
    });

    // Version Display
    this.add.bitmapText(WIDTH - 10, HEIGHT - 10, 'arcade', `Version: ${VERSION}`, 12)
      .setOrigin(1, 1)
      .setTint(0xcccccc)
      .setDepth(1000);
  }
}
