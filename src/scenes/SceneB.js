import {
  WIDTH,
  HEIGHT,
  PORTAL_EXTRA_LIFE,
  GAME_OVER_TEXT,
  MOVING_PLATFORM,
  EXTRA_BOMB_WAVE_BEFORE_PORTAL,
  PORTAL_WAVE_INTERVAL,
  FINAL_LEVEL_BACKGROUND_KEY,
  FINAL_LEVEL_WARNING_WAVE,
  FINAL_LEVEL_BOSS_WAVE,
  FINAL_LEVEL_REWARD_WAVE,
  FINAL_LEVEL_BOSS_HP,
  FINAL_LEVEL_REWARD_STARS,
  FINAL_LEVEL_BOMB_CAP,
  BOSS_WARNING_SCALE,
  BOSS_SCALE,
  BOSS_JUMP_INTERVAL_MS,
  BOSS_JUMP_VELOCITY_Y,
  BOSS_SPEED_X,
  BOSS_PLATFORM_LANDING_TOLERANCE,
  BOMB_VELOCITY_MIN,
  BOMB_VELOCITY_MAX,
  BOMB_INITIAL_VY,
} from '../config.js';
import { state } from '../state.js';
import {
  collectStar,
  bounce,
  hitBomb,
  damagePlayer,
  isPlayerInvulnerable,
} from '../logic.js';
import { BACKGROUND_SEQUENCE } from '../backgrounds.js';
import { AudioManager } from '../audio.js';
import { setupFullscreen } from '../ui/fullscreen.js';
import { Controls } from '../systems/Controls.js';
import { Spawner } from '../systems/Spawner.js';
import { HUDSync } from '../systems/HUDSync.js';
import { advanceMovingPlatform } from '../systems/movingPlatform.js';
import { RETRO_PALETTE, addCrtOverlay } from '../theme.js';

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
    this._gameOverBlinkTween = null;
    this._playerInvulnerabilityTween = null;
    this._forcedPortalVariantIndex = null;
    this.starColliders = [];
    this.bossColliders = [];
    this.boss = null;
    this.bossJumpEvent = null;
    this.bossWarning = null;
    this.currentStarCount = state.starsPerWave;
    this.finalLevelWave = 0;
    this.bossHp = 0;
    this.rewardWaveActive = false;
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

    this.bgKey = bgKey;
    this.isFinalLevel = bgKey === FINAL_LEVEL_BACKGROUND_KEY;

    this.audio.playForBackground(bgKey);
    this.add.image(WIDTH / 2, HEIGHT / 2, bgKey);

    // Retro CRT-style overlay
    this.crtOverlay = addCrtOverlay(this, WIDTH, HEIGHT, {
      enabled: true,
      scanlineAlpha: 0.12,
      vignetteAlpha: 0.22,
      depth: 970,
    });

    // Preload SFX
    this.sound.add('gameOver');
    this.sound.add('ping');
    this.sound.add('explode');
    this.sound.add('portalJump');
    this.sound.add('bossHit');

    // Platforms
    const groundKey =
      bgKey === 'alien_landscape'
        ? 'ground_alien'
        : bgKey !== 'sky'
          ? 'ground_space'
          : 'ground';
    const spawnedPlatforms = this.spawner.spawnPlatforms(
      groundKey,
      state.variantIndex,
    );
    state.platforms = spawnedPlatforms.platforms;
    state.movingPlatforms = spawnedPlatforms.movingPlatforms;
    state.movingPlatformState = {
      layoutSeed: spawnedPlatforms.layout.seed,
      mode: MOVING_PLATFORM.mode,
    };

    // Player
    state.player = this.spawner.spawnPlayer();

    // Collectibles
    state.stars = this.spawner.spawnStars(state.starsPerWave);
    state.bombs = this.spawner.spawnBombs();

    if (this.isFinalLevel) {
      this.initializeFinalLevel();
    }

    // UI & Misc
    setupFullscreen(this);
    this.setupMuteToggle();

    // Physics
    this.setupPhysics();

    this.gameOverText = this.add
      .bitmapText(GAME_OVER_TEXT.x, GAME_OVER_TEXT.y - 20, 'arcade', 'GAME OVER', 38)
      .setOrigin(0.5)
      .setDepth(1000)
      .setTint(RETRO_PALETTE.red)
      .setVisible(false);

    this.gameOverPrompt = this.add
      .bitmapText(GAME_OVER_TEXT.x, GAME_OVER_TEXT.y + 30, 'arcade', 'PRESS ANY KEY', 16)
      .setOrigin(0.5)
      .setDepth(1000)
      .setTint(RETRO_PALETTE.white)
      .setVisible(false);

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
    this.physics.add.collider(state.player, state.movingPlatforms);
    this.bindStarPhysics();

    this.physics.add.collider(
      state.bombs,
      state.platforms,
      bounce.bind(this),
      null,
      this,
    );
    this.physics.add.collider(
      state.bombs,
      state.movingPlatforms,
      bounce.bind(this),
      null,
      this,
    );

    this.physics.add.collider(
      state.player,
      state.bombs,
      hitBomb.bind(this),
      this.canPlayerTakeBombHit,
      this,
    );
  }

  canPlayerTakeBombHit() {
    return !isPlayerInvulnerable(this);
  }

  bindStarPhysics() {
    this.starColliders.forEach((collider) => collider?.destroy?.());
    this.starColliders = [
      this.physics.add.collider(state.stars, state.platforms),
      this.physics.add.collider(state.stars, state.movingPlatforms),
      this.physics.add.overlap(
        state.player,
        state.stars,
        collectStar.bind(this),
        null,
        this,
      ),
    ];
  }

  initializeFinalLevel() {
    this.finalLevelWave = FINAL_LEVEL_WARNING_WAVE;
    this.bossHp = FINAL_LEVEL_BOSS_HP;
    this.rewardWaveActive = false;
    this.showBossWarning();
  }

  showBossWarning() {
    const warningY = 86;
    this.bossWarning = this.add
      .image(WIDTH / 2, warningY, 'boss_incoming')
      .setDepth(985)
      .setScale(BOSS_WARNING_SCALE);

    this.bossWarningText = this.add
      .bitmapText(WIDTH / 2, warningY + 42, 'arcade', 'WARNING', 18)
      .setOrigin(0.5)
      .setDepth(986)
      .setTint(RETRO_PALETTE.red);

    this.tweens.add({
      targets: [this.bossWarning, this.bossWarningText],
      alpha: 0.2,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });
  }

  clearBossWarning() {
    this.bossWarning?.destroy?.();
    this.bossWarningText?.destroy?.();
    this.bossWarning = null;
    this.bossWarningText = null;
  }

  replaceStars(starCount) {
    this.starColliders.forEach((collider) => collider?.destroy?.());
    this.starColliders = [];

    try {
      state.stars?.clear?.(true, true);
    } catch (e) {
      console.warn('Error clearing existing stars:', e);
    }

    state.stars = this.spawner.spawnStars(starCount);
    this.currentStarCount = starCount;
    this.bindStarPhysics();
  }

  resetExistingStars() {
    try {
      state.stars.children.iterate((child) => {
        child.enableBody(true, child.x, 0, true, true);
      });
    } catch (e) {
      console.warn('Error resetting stars for next wave:', e);
    }
  }

  emitWaveAdvance() {
    state.wave += 1;
    try {
      this.game.events.emit('hud:wave', state.wave);
      this.game.events.emit('wave:start', state.wave);
    } catch (e) {
      console.warn('Error emitting wave events:', e);
    }
  }

  spawnBombNearPlayer(player) {
    const px = player?.x ?? 400;
    const spawnX =
      px < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    if (this.isBossBombCapActive()) {
      this.trimBossFightBombs(FINAL_LEVEL_BOMB_CAP - 1);
    }

    const bomb = state.bombs?.create?.(spawnX, 16, 'bomb');
    if (!bomb) return null;

    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(
      Phaser.Math.Between(BOMB_VELOCITY_MIN, BOMB_VELOCITY_MAX),
      BOMB_INITIAL_VY,
    );
    bomb.allowGravity = false;
    bomb.spawnedAt = this.time.now;
    return bomb;
  }

  isBossBombCapActive() {
    return (
      this.isFinalLevel &&
      this.finalLevelWave >= FINAL_LEVEL_BOSS_WAVE &&
      !this.rewardWaveActive &&
      !state.portalJump
    );
  }

  trimBossFightBombs(maxBombs) {
    const activeBombs = [];
    state.bombs?.children?.iterate?.((child) => {
      if (child?.active) activeBombs.push(child);
    });

    activeBombs
      .sort((a, b) => (a.spawnedAt || 0) - (b.spawnedAt || 0))
      .slice(0, Math.max(0, activeBombs.length - maxBombs))
      .forEach((bomb) => bomb.disableBody(true, true));
  }

  spawnStandardWaveBomb(player) {
    const bomb = this.spawnBombNearPlayer(player);
    if (
      bomb &&
      (state.wave + EXTRA_BOMB_WAVE_BEFORE_PORTAL) % PORTAL_WAVE_INTERVAL === 0 &&
      !this.isFinalLevel
    ) {
      this.spawnBombNearPlayer(player);
    }
    return bomb;
  }

  handleWaveCleared(player) {
    if (this.isFinalLevel) {
      this.handleFinalLevelWaveCleared(player);
      return;
    }

    this.resetExistingStars();
    this.spawnStandardWaveBomb(player);
    this.emitWaveAdvance();

    if (state.wave % PORTAL_WAVE_INTERVAL === 0) {
      try {
        this.sound.play('portalJump');
      } catch (e) { console.warn('Error playing portalJump sound:', e); }
      state.portalJump = true;
    }
  }

  handleFinalLevelWaveCleared(player) {
    if (this.finalLevelWave === FINAL_LEVEL_WARNING_WAVE) {
      this.clearBossWarning();
      this.resetExistingStars();
      this.emitWaveAdvance();
      this.finalLevelWave = FINAL_LEVEL_BOSS_WAVE;
      this.spawnStandardWaveBomb(player);
      this.spawnBoss();
      return;
    }

    if (this.rewardWaveActive) {
      this.finishFinalLevelReward();
      return;
    }

    this.damageBoss();
    this.spawnBombNearPlayer(player);
    this.emitWaveAdvance();
    this.spawnStandardWaveBomb(player);

    if (this.bossHp > 0) {
      this.finalLevelWave += 1;
      this.resetExistingStars();
      return;
    }

    this.finalLevelWave = FINAL_LEVEL_REWARD_WAVE;
    this.rewardWaveActive = true;
    this.stopBossBehavior();
    this.destroyBoss();
    this.replaceStars(FINAL_LEVEL_REWARD_STARS);
    this.trimBossFightBombs(FINAL_LEVEL_BOMB_CAP);
  }

  finishFinalLevelReward() {
    this.emitWaveAdvance();
    this.rewardWaveActive = false;
    this._forcedPortalVariantIndex = 1;
    try {
      this.sound.play('portalJump');
    } catch (e) { console.warn('Error playing portalJump sound:', e); }
    state.portalJump = true;
  }

  getBossAnchors() {
    const anchors = [];
    const collect = (group) => {
      group?.children?.iterate?.((platform) => {
        if (!platform?.active) return;
        anchors.push({
          x: platform.x,
          y: platform.y,
        });
      });
    };

    collect(state.platforms);
    collect(state.movingPlatforms);

    return anchors
      .filter((anchor) => anchor.y < HEIGHT - 8)
      .sort((a, b) => a.y - b.y);
  }

  bossShouldLandOnPlatform(_boss, platform) {
    if (!this.boss?.active || !platform?.body) return false;

    const bossBody = this.boss.body;
    if (!bossBody || bossBody.velocity.y <= 0) return false;

    const frameDeltaSeconds = (this.game.loop.delta || 16.67) / 1000;
    const previousBottom = bossBody.bottom - bossBody.velocity.y * frameDeltaSeconds;
    const platformTop = platform.body.top;
    const withinVerticalWindow =
      previousBottom <= platformTop + BOSS_PLATFORM_LANDING_TOLERANCE &&
      bossBody.bottom >= platformTop - BOSS_PLATFORM_LANDING_TOLERANCE;

    if (!withinVerticalWindow) return false;

    const bossLeft = bossBody.left + 12;
    const bossRight = bossBody.right - 12;
    return bossRight > platform.body.left && bossLeft < platform.body.right;
  }

  hitBoss(player, boss) {
    damagePlayer.call(this, player, boss);
  }

  spawnBoss() {
    if (this.boss?.active) return;

    const anchors = this.getBossAnchors();
    const elevatedAnchors = anchors.filter((anchor) => anchor.y < HEIGHT - 80);
    const startAnchor =
      elevatedAnchors[Math.floor(elevatedAnchors.length / 2)] ||
      anchors[0] ||
      { x: WIDTH / 2, y: HEIGHT - 64 };

    this.boss = this.physics.add
      .sprite(startAnchor.x, startAnchor.y - 80, 'boss')
      .setDepth(990)
      .setBounce(0.1)
      .setCollideWorldBounds(true);

    this.boss.setScale(BOSS_SCALE);
    this.boss.body.setSize(
      Math.max(24, this.boss.displayWidth * 0.58),
      Math.max(24, this.boss.displayHeight * 0.72),
      true,
    );

    this.bossColliders = [
      this.physics.add.collider(
        this.boss,
        state.platforms,
        null,
        this.bossShouldLandOnPlatform,
        this,
      ),
      this.physics.add.collider(
        this.boss,
        state.movingPlatforms,
        null,
        this.bossShouldLandOnPlatform,
        this,
      ),
      this.physics.add.overlap(
        state.player,
        this.boss,
        this.hitBoss,
        null,
        this,
      ),
    ];

    this.startBossBehavior();
  }

  startBossBehavior() {
    this.stopBossBehavior();
    this.bossJumpEvent = this.time.addEvent({
      delay: BOSS_JUMP_INTERVAL_MS,
      loop: true,
      callback: () => this.performBossJump(),
    });
  }

  stopBossBehavior() {
    this.bossJumpEvent?.remove?.();
    this.bossJumpEvent = null;
  }

  destroyBoss() {
    this.bossColliders.forEach((collider) => collider?.destroy?.());
    this.bossColliders = [];
    this.boss?.destroy?.();
    this.boss = null;
  }

  performBossJump() {
    if (!this.boss?.active) return;

    const body = this.boss.body;
    if (!body?.blocked?.down && !body?.touching?.down) return;

    const anchors = this.getBossAnchors();
    const candidates = anchors.filter((anchor) => Math.abs(anchor.x - this.boss.x) > 48);
    const target =
      Phaser.Utils.Array.GetRandom(candidates.length ? candidates : anchors) ||
      { x: this.boss.x, y: this.boss.y };

    const dx = target.x - this.boss.x;
    const targetIsHigher = target.y < this.boss.y - 24;
    const velocityY = targetIsHigher ? BOSS_JUMP_VELOCITY_Y - 40 : BOSS_JUMP_VELOCITY_Y;

    this.boss.setFlipX(dx < 0);
    this.boss.setVelocityX(
      Phaser.Math.Clamp(dx * 1.25, -BOSS_SPEED_X, BOSS_SPEED_X),
    );
    this.boss.setVelocityY(velocityY);
  }

  damageBoss() {
    if (!this.boss?.active) return;

    this.bossHp -= 1;
    try {
      this.sound.play('bossHit', { volume: 0.5 });
    } catch (e) {
      console.warn('Error playing boss hit sound:', e);
    }

    this.boss.setTint(0xff6666);
    this.time.delayedCall(150, () => {
      this.boss?.clearTint?.();
    });
  }

  handleShutdown() {
    try {
      this.audio?.stop?.();
      this._playerInvulnerabilityTween?.stop?.();
      this._playerInvulnerabilityTween = null;
      this.stopBossBehavior();
      this.destroyBoss();
      this.clearBossWarning();
      this.starColliders.forEach((collider) => collider?.destroy?.());
      if (state.stars?.children) state.stars.clear(true, true);
      if (state.bombs?.children) state.bombs.clear(true, true);
      if (state.platforms?.children) state.platforms.clear(true, true);
      if (state.movingPlatforms?.children) state.movingPlatforms.clear(true, true);
      this.tweens?.killAll?.();
      this.time?.removeAllEvents?.();
      this.input?.removeAllListeners?.();
      this.crtOverlay?.destroy?.();
    } catch (e) {
      console.warn('Error during SceneB shutdown:', e);
    }
  }

  update(_time, delta) {
    if (state.gameOver) {
      this.handleGameOver();
      return;
    }

    if (state.portalJump && state.lives > 0) {
      this.handlePortalJump();
      return;
    }

    this.updateMovingPlatforms(delta);
    this.controls.update(state.player, state.gameOver);
  }

  updateMovingPlatforms(deltaMs) {
    if (!state.movingPlatforms?.children) return;
    state.movingPlatforms.children.iterate((platform) =>
      advanceMovingPlatform(platform, deltaMs),
    );
  }

  handleGameOver() {
    try {
      this.audio?.stop();
    } catch (e) {
      console.warn('Error stopping audio on game over:', e);
    }

    this.gameOverText.visible = true;
    this.gameOverPrompt.visible = true;

    if (!this._gameOverBlinkTween) {
      this._gameOverBlinkTween = this.tweens.add({
        targets: this.gameOverPrompt,
        alpha: 0.25,
        duration: 420,
        yoyo: true,
        repeat: -1,
      });
    }

    if (!this._endBound) {
      this._endBound = true;
      this.input.enabled = true;

      const finish = () => {
        this.hudSync.stopHUD();
        this.scene.start('SceneC');
      };

      this.input.once('pointerup', finish);
      this.input.keyboard.once('keydown', finish);
    }
  }

  handlePortalJump() {
    state.portalJump = false;

    if (state.bombs?.countActive(true) > 0) {
      state.bombs.children.iterate((child) => child.disableBody(true, true));
    }

    state.lives += PORTAL_EXTRA_LIFE;
    this.hudSync.refreshHUD(state);

    this.input.enabled = false;
    this.physics.pause();
    const nextVariant = this._forcedPortalVariantIndex ?? ((state.variantIndex || 0) + 1);
    this._forcedPortalVariantIndex = null;
    this.scene.launch('PortalScene', {
      from: 'SceneB',
      to: 'SceneB',
      variantIndex: nextVariant,
    });
  }
}
