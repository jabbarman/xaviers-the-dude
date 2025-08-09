import { WIDTH, HEIGHT } from '../config.js';
import { state } from '../state.js';
import { collectStar, bounce, hitBomb } from '../logic.js';

export class SceneB extends Phaser.Scene {
  constructor() {
    super('SceneB');
  }

  create() {
    // Launch overlay scenes
    this.scene.launch('UIScene');
    this.scene.launch('PostFXScene');
    this.game.events.emit('hud:lives',  state.lives);
    this.game.events.emit('hud:score',  state.score);
    this.game.events.emit('hud:hiscore',state.hiScore);
    this.game.events.emit('hud:wave',   state.wave);
    this.game.events.emit('wave:start', state.wave);
    // Music
    state.music = this.sound.add('boden');
    state.music.play();
    this.sound.add('gameOver');
    this.sound.add('ping');
    this.sound.add('explode');
    this.sound.add('portalJump');

    // Background
    this.add.image(WIDTH / 2, HEIGHT / 2, 'sky');

    // Platforms
    state.platforms = this.physics.add.staticGroup();
    state.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    state.platforms.create(600, 400, 'ground');
    state.platforms.create(50, 250, 'ground');
    state.platforms.create(750, 220, 'ground');

    // Player
    state.player = this.physics.add.sprite(100, 450, 'dude');
    state.player.setBounce(0.2);
    state.player.setCollideWorldBounds(true);

    // Animations
    this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'turn', frames: [{ key: 'dude', frame: 4 }], frameRate: 20 });
    this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

    // Input
    state.cursors = this.input.keyboard.createCursorKeys();

    // Stars
    const stepX = Math.floor(WIDTH / (state.starsPerWave + 1));
    state.stars = this.physics.add.group({ key: 'star', repeat: state.starsPerWave, setXY: { x: 12, y: 0, stepX } });
    state.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Bombs
    state.bombs = this.physics.add.group();

    // Game over text (scene property, not in state to avoid leakage across runs)
    this.gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#000' });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.visible = false;

    // Colliders
    this.physics.add.collider(state.player, state.platforms);
    this.physics.add.collider(state.stars, state.platforms);
    this.physics.add.collider(state.bombs, state.platforms, bounce.bind(this), null, this);

    // Overlaps
    this.physics.add.overlap(state.player, state.stars, collectStar.bind(this), null, this);
    this.physics.add.collider(state.player, state.bombs, hitBomb.bind(this), null, this);

    // Fullscreen button
    const button = this.add.image(WIDTH - 16, 16, 'fullscreen', 0).setOrigin(1, 0).setInteractive();
    button.on('pointerup', function () {
      if (this.scale.isFullscreen) {
        button.setFrame(0);
        this.scale.stopFullscreen();
      } else {
        button.setFrame(1);
        this.scale.startFullscreen();
      }
    }, this);

    const FKey = this.input.keyboard.addKey('F');
    FKey.on('down', function () {
      if (this.scale.isFullscreen) {
        button.setFrame(0);
        this.scale.stopFullscreen();
      } else {
        button.setFrame(1);
        this.scale.startFullscreen();
      }
    }, this);
  }

  update(time, delta) {
    if (state.gameOver) {
      state.music.stop();
      this.gameOverText.visible = true;
      this.input.on('pointerup', function () {
        this.scene.start('SceneC');
      }, this);
    }

    if (state.portalJump) {
      state.lives = state.lives + 1;
      this.game.events.emit('hud:lives', state.lives);
      if (state.bombs.countActive(true) > 0) {
        state.bombs.children.iterate(function (child) { child.disableBody(true, true); });
      }
      state.bombs = this.physics.add.group();
      this.physics.add.collider(state.bombs, state.platforms, bounce.bind(this), null, this);
      this.physics.add.collider(state.player, state.bombs, hitBomb.bind(this), null, this);

      state.music.stop();
      state.music = this.sound.add('tommy');
      state.music.play();

      state.portalJump = false;
    }

    if (state.cursors.left.isDown) {
      state.player.setVelocityX(-160);
      state.player.anims.play('left', true);
    } else if (state.cursors.right.isDown) {
      state.player.setVelocityX(160);
      state.player.anims.play('right', true);
    } else {
      state.player.setVelocityX(0);
      state.player.anims.play('turn');
    }

    if (state.cursors.up.isDown && state.player.body.touching.down) {
      state.player.setVelocityY(-330);
    }
  }
}
