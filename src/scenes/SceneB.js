import {
  WIDTH,
  HEIGHT,
  PORTAL_EXTRA_LIFE,
  GAME_OVER_TEXT,
} from '../config.js';
import { state } from '../state.js';
import { collectStar, bounce, hitBomb } from '../logic.js';
import { BACKGROUND_SEQUENCE } from '../backgrounds.js';
import { AudioManager } from '../audio.js';
import { setupFullscreen } from '../ui/fullscreen.js';
import { Controls } from '../systems/Controls.js';
import { Spawner } from '../systems/Spawner.js';
import { HUDSync } from '../systems/HUDSync.js';

export class SceneB extends Phaser.Scene {
  constructor() {
    super('SceneB');
  }

  init(data) {
    if (typeof data?.variantIndex === 'number') {
      state.variantIndex = data.variantIndex;
    }
  }

  create() {
    this._endBound = false;
    this.input.enabled = true;

    // Initialize systems
    this.controls = new Controls(this);
    this.spawner = new Spawner(this);
    this.hudSync = new HUDSync(this);
    this.audio = new AudioManager(this);

    // Launch HUD
    this.hudSync.initHUD(state);

    // Determine background key
    const bgKey = this.sys.game.config.backgroundForVariant
      ? this.sys.game.config.backgroundForVariant(state.variantIndex)
      : state.variantIndex === 0
        ? 'sky'
        : BACKGROUND_SEQUENCE[
        (state.variantIndex - 1 + BACKGROUND_SEQUENCE.length) %
        BACKGROUND_SEQUENCE.length
        ];

    this.audio.playForBackground(bgKey);
    this.add.image(WIDTH / 2, HEIGHT / 2, bgKey);

    // Preload SFX
    this.sound.add('gameOver');
    this.sound.add('ping');
    this.sound.add('explode');
    this.sound.add('portalJump');

    // Platforms
    const groundKey =
      bgKey === 'alien_landscape'
        ? 'ground_alien'
        : bgKey !== 'sky'
          ? 'ground_space'
          : 'ground';
    state.platforms = this.spawner.spawnPlatforms(groundKey, state.variantIndex);

    // Player
    state.player = this.spawner.spawnPlayer();

    // Collectibles
    state.stars = this.spawner.spawnStars(state.starsPerWave);
    state.bombs = this.spawner.spawnBombs();

    // UI & Misc
    setupFullscreen(this);
    this.setupMuteToggle();

    // Physics
    this.setupPhysics();

    this.gameOverText = this.add.text(
      GAME_OVER_TEXT.x,
      GAME_OVER_TEXT.y,
      'Game Over',
      { fontSize: GAME_OVER_TEXT.fontSize, fill: GAME_OVER_TEXT.fill },
    );
    this.gameOverText.setOrigin(0.5).setDepth(1000).setVisible(false);

    // Cleanup
    this.events.once('shutdown', () => this.handleShutdown());
  }

  setupMuteToggle() {
    const MKey = this.input.keyboard.addKey('M');
    MKey.on('down', () => {
      const muted = this.audio.toggleMute();
      this.hudSync.emitMute(muted);
    });
  }

  setupPhysics() {
    this.physics.add.collider(state.player, state.platforms);
    this.physics.add.collider(state.stars, state.platforms);
    this.physics.add.collider(
      state.bombs,
      state.platforms,
      bounce.bind(this),
      null,
      this,
    );

    this.physics.add.overlap(
      state.player,
      state.stars,
      collectStar.bind(this),
      null,
      this,
    );
    this.physics.add.collider(
      state.player,
      state.bombs,
      hitBomb.bind(this),
      null,
      this,
    );
  }

  handleShutdown() {
    try {
      this.audio?.stop?.();
      if (state.stars?.children) state.stars.clear(true, true);
      if (state.bombs?.children) state.bombs.clear(true, true);
      if (state.platforms?.children) state.platforms.clear(true, true);
      this.tweens?.killAll?.();
      this.time?.removeAllEvents?.();
      this.input?.removeAllListeners?.();
    } catch (e) {
      console.warn('Error during SceneB shutdown:', e);
    }
  }

  update(_time, _delta) {
    if (state.gameOver) {
      this.handleGameOver();
      return;
    }

    if (state.portalJump && state.lives > 0) {
      this.handlePortalJump();
      return;
    }

    this.controls.update(state.player, state.gameOver);
  }

  handleGameOver() {
    try {
      this.audio?.stop();
    } catch (e) { console.warn('Error stopping audio on game over:', e); }
    this.gameOverText.visible = true;

    if (!this._endBound) {
      this._endBound = true;
      this.input.enabled = true;
      this.input.once('pointerup', () => {
        this.hudSync.stopHUD();
        this.scene.start('SceneC');
      });
    }
  }

  handlePortalJump() {
    state.portalJump = false;

    if (state.bombs?.countActive(true) > 0) {
      state.bombs.children.iterate(child => child.disableBody(true, true));
    }

    state.lives += PORTAL_EXTRA_LIFE;
    this.hudSync.refreshHUD(state);

    this.input.enabled = false;
    this.physics.pause();
    const nextVariant = (state.variantIndex || 0) + 1;
    this.scene.launch('PortalScene', {
      from: 'SceneB',
      to: 'SceneB',
      variantIndex: nextVariant,
    });
  }
}
