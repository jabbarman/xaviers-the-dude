import { WIDTH, HEIGHT } from '../config.js';

export class SceneA extends Phaser.Scene {
  constructor() {
    super('SceneA');
  }

  preload() {
    this.load.image('background_image', 'assets/sky.png');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    this.add.text(150, 230, 'The Dude', { fontSize: '100px', color: '#0000FF' });

    this.input.on('pointerup', function () {
      this.scene.start('SceneB');
    }, this);
  }
}
