import { state } from '../state.js';

export class SceneC extends Phaser.Scene {
  constructor() {
    super('SceneC');
  }

  preload() {
    this.load.image('background_image', '/assets/sky.png');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    this.add.text(180, 200, 'The End', { fontSize: '100px', color: '#0000FF' });
    this.add.text(180, 300, 'Your Score ' + state.score, { fontSize: '50px', color: '#0000FF' });
    this.add.text(180, 380, 'High Score ' + state.hiScore, { fontSize: '50px', color: '#0000FF' });
    this.input.on('pointerup', function () {
      this.scene.start('SceneD');
    }, this);
  }
}
