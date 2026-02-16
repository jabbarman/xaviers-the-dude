import { addTitle, addBig, RETRO_PALETTE } from '../theme.js';
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

    // Menu SFX helpers (safe no-op if audio is unavailable)
    const playMoveSfx = () => {
      try {
        this.sound.play('bounce', { volume: 0.15 });
      } catch (_e) {
        // ignore audio failures
      }
    };
    const playSelectSfx = () => {
      try {
        this.sound.play('ping', { volume: 0.22 });
      } catch (_e) {
        // ignore audio failures
      }
    };

    // Center the titles
    addTitle(this, WIDTH / 2, 200, 'XAVIER').setOrigin(0.5);
    addTitle(this, WIDTH / 2, 250, 'THE DUDE').setOrigin(0.5);

    // Start Game Button
    const startBtn = addBig(this, WIDTH / 2, 350, 'START GAME')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', playMoveSfx);
    startBtn.on('pointerup', () => {
      playSelectSfx();
      try {
        state.reset();
      } catch (e) {
        console.warn('Error during state reset in SceneA:', e);
      }
      this.scene.start('SceneB', { variantIndex: 0 });
    });

    // High Scores Button
    const scoresBtn = addBig(this, WIDTH / 2, 410, 'HI SCORES')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    scoresBtn.on('pointerover', playMoveSfx);
    scoresBtn.on('pointerup', () => {
      playSelectSfx();
      this.scene.start('SceneHighScore');
    });

    // Version Display
    this.add
      .bitmapText(WIDTH - 10, HEIGHT - 10, 'arcade', `Version: ${VERSION}`, 12)
      .setOrigin(1, 1)
      .setTint(RETRO_PALETTE.softWhite)
      .setDepth(1000);
  }
}
