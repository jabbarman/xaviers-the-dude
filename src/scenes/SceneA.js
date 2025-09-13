import { addTitle } from '../theme.js';
import { state } from '../state.js';

export class SceneA extends Phaser.Scene {
  constructor() {
    super('SceneA');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    addTitle(this, 280, 250, ' XAVIER');
    addTitle(this, 280, 300, 'THE DUDE');

    this.input.on('pointerup', function () {
      // Start a fresh run: reset the transient state
      try { state.reset(); } catch(e) {}
      this.scene.start('SceneB');
    }, this);
  }
}
