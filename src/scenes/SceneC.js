import { state } from '../state.js';

export class SceneC extends Phaser.Scene {
  constructor() {
    super('SceneC');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    import('../theme.js').then(({addTitle})=> addTitle(this, 180, 200, 'THE END'));
    import('../theme.js').then(({addBig})  => addBig(this,   180, 300, 'YOUR SCORE ' + state.score));
    import('../theme.js').then(({addBig})  => addBig(this,   180, 360, 'HIGH SCORE ' + state.hiScore));
    this.input.on('pointerup', function () {
      this.scene.start('SceneD');
    }, this);
  }
}
