import { WIDTH, HEIGHT, PLAYER_SPEED_X, PLAYER_JUMP_VELOCITY, PLAYER_BOUNCE, STARS_BOUNCE_MIN, STARS_BOUNCE_MAX, PORTAL_EXTRA_LIFE, GAME_OVER_TEXT } from '../config.js';
import { state } from '../state.js';
import { collectStar, bounce, hitBomb } from '../logic.js';
import { BACKGROUND_SEQUENCE } from '../backgrounds.js';
import { AudioManager } from '../audio.js';

export class SceneB extends Phaser.Scene {
  constructor() {
    super('SceneB');
  }

  init(data) {
    // Ensure variantIndex is updated when SceneB is (re)started with data
    if (typeof data?.variantIndex === 'number') {
      state.variantIndex = data.variantIndex;
    }
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

    // Centralized music per background via AudioManager
    this.audio = new AudioManager(this);
    // Determine background key from variant consistently
    const bgKey = this.sys.game.config.backgroundForVariant
      ? this.sys.game.config.backgroundForVariant(state.variantIndex)
      : (state.variantIndex === 0 ? 'sky' : BACKGROUND_SEQUENCE[(state.variantIndex - 1 + BACKGROUND_SEQUENCE.length) % BACKGROUND_SEQUENCE.length]);
    this.audio.playForBackground(bgKey);
    // Preload/ensure SFX are ready
    this.sound.add('gameOver');
    this.sound.add('ping');
    this.sound.add('explode');
    this.sound.add('portalJump');

    // Ensure track stops on scene shutdown/transition
    this.events.once('shutdown', () => { try { this.audio.stop(); } catch(e){} });

    // Background varies with variant: draw selected background
    this.add.image(WIDTH / 2, HEIGHT / 2, bgKey);

    // Choose platform texture based on background
    const groundKey = (bgKey === 'alien_landscape')
      ? 'ground_alien'
      : (bgKey !== 'sky' ? 'ground_space' : 'ground');

    // Platforms vary slightly with variant to create a "SceneD" flavor
    state.platforms = this.physics.add.staticGroup();
    if (state.variantIndex % 2 === 1) {
      state.platforms.create(400, 568, groundKey).setScale(2).refreshBody();
      state.platforms.create(650, 420, groundKey);
      state.platforms.create(120, 300, groundKey);
      state.platforms.create(720, 180, groundKey);
    } else {
      state.platforms.create(400, 568, groundKey).setScale(2).refreshBody();
      state.platforms.create(600, 400, groundKey);
      state.platforms.create(50, 250, groundKey);
      state.platforms.create(750, 220, groundKey);
    }

    // Player
    state.player = this.physics.add.sprite(100, 450, 'dude');
    state.player.setBounce(PLAYER_BOUNCE);
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
      child.setBounceY(Phaser.Math.FloatBetween(STARS_BOUNCE_MIN, STARS_BOUNCE_MAX));
    });

    // Bombs
    state.bombs = this.physics.add.group();

    // Clean-up handlers to avoid lingering physics groups/timers
    this.events.once('shutdown', () => {
      try {
        state.stars?.clear(true, true);
        state.bombs?.clear(true, true);
        state.platforms?.clear(true, true);
      } catch(e) {}
      try { this.tweens.killAll(); } catch(e) {}
      try { this.time?.removeAllEvents(); } catch(e) {}
      try { this.input?.removeAllListeners(); } catch(e) {}
    });

    // Game over text (scene property, not in state to avoid leakage across runs)
    this.gameOverText = this.add.text(GAME_OVER_TEXT.x, GAME_OVER_TEXT.y, 'Game Over', { fontSize: GAME_OVER_TEXT.fontSize, fill: GAME_OVER_TEXT.fill });
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
      try { this.audio?.stop(); } catch(e){}
      this.gameOverText.visible = true;
      if (!this._endBound) {
        this._endBound = true;
        // Register a one-time pointerup to proceed to SceneC to avoid duplicate handlers
        this.input.once('pointerup', () => {
          this.scene.start('SceneC');
        });
      }
    }

    // Handle portal jump: delegate to PortalScene to animate and restart SceneB with a new variant
    if (state.portalJump && state.lives > 0) {
      state.portalJump = false; // prevent re-trigger

      // Clear bombs to avoid stray collisions during transition
      if (state.bombs?.countActive(true) > 0) {
        state.bombs.children.iterate(function (child) { child.disableBody(true, true); });
      }

      // Award an extra life on a successful portal
      state.lives += PORTAL_EXTRA_LIFE;
      this.game.events.emit('hud:lives', state.lives);

      // Disable input during transition, pause physics, and launch PortalScene on top
      this.input.enabled = false;
      this.physics.pause();
      const nextVariant = (state.variantIndex || 0) + 1;
      this.scene.launch('PortalScene', { from: 'SceneB', to: 'SceneB', variantIndex: nextVariant });
    }

    if (state.cursors.left.isDown) {
      state.player.setVelocityX(-PLAYER_SPEED_X);
      state.player.anims.play('left', true);
    } else if (state.cursors.right.isDown) {
      state.player.setVelocityX(PLAYER_SPEED_X);
      state.player.anims.play('right', true);
    } else {
      state.player.setVelocityX(0);
      state.player.anims.play('turn');
    }

    if (state.cursors.up.isDown && state.player.body.touching.down) {
      state.player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }
}
