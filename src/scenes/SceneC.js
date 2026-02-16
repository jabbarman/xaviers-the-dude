import { state } from '../state.js';
import { addTitle, addBig, RETRO_PALETTE } from '../theme.js';
import { WIDTH } from '../config.js';

export class SceneC extends Phaser.Scene {
  constructor() {
    super('SceneC');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);

    addTitle(this, WIDTH / 2, 190, 'THE END').setOrigin(0.5);
    addBig(this, WIDTH / 2, 285, 'YOUR SCORE ' + state.score).setOrigin(0.5);
    addBig(this, WIDTH / 2, 345, 'HIGH SCORE ' + state.hiScore).setOrigin(0.5);

    const prompt = this.add
      .bitmapText(WIDTH / 2, 430, 'arcade', 'PRESS ANY KEY', 16)
      .setOrigin(0.5)
      .setTint(RETRO_PALETTE.white)
      .setDepth(1000);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    const goToScores = () => {
      this.scene.start('SceneHighScore');
    };

    this.input.once('pointerup', goToScores);
    this.input.keyboard.once('keydown', goToScores);
  }
}
