import { state } from '../state.js';
import { addTitle, addBig } from '../theme.js';

export class SceneC extends Phaser.Scene {
  constructor() {
    super('SceneC');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    addTitle(this, 180, 200, 'THE END');
    addBig(this, 180, 300, 'YOUR SCORE ' + state.score);
    addBig(this, 180, 360, 'HIGH SCORE ' + state.hiScore);
    this.input.on('pointerup', function () {
      this.scene.start('SceneD');
    }, this);
  }
}
