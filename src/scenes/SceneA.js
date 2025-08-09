export class SceneA extends Phaser.Scene {
  constructor() {
    super('SceneA');
  }

  create() {
    const background = this.add.sprite(0, 0, 'background_image');
    background.setOrigin(0, 0);
    import('../theme.js').then(({addTitle})=> addTitle(this, 280, 300, 'THE DUDE'));

    this.input.on('pointerup', function () {
      this.scene.start('SceneB');
    }, this);
  }
}
