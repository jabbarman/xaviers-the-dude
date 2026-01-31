import { state } from '../state.js';
import { addHud } from '../theme.js';
import {
  WIDTH,
  HEIGHT,
  MOBILE_BUTTON_SIZE,
  MOBILE_BUTTON_MARGIN,
  MOBILE_BUTTON_OPACITY,
  MOBILE_BUTTON_COLOR,
} from '../config.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.hiScoreText = addHud(this, 280, 10, 'HI SCORE: ' + state.hiScore);
    this.livesText = addHud(this, 10, 10, 'LIVES: ' + state.lives);
    this.waveText = addHud(this, 10, 30, 'WAVE : ' + state.wave);
    this.scoreText = addHud(this, 10, 50, 'SCORE: ' + state.score);

    // Mute indicator (top-right, moved left to prevent overflow)
    this.muteText = addHud(this, 580, 10, 'M Sound: On');

    // Create mobile controls if touch is available
    this.createMobileControls();

    // Optional FPS (debug only, also moved left)
    this.fpsText = addHud(this, 580, 30, 'FPS: 0');
    this.fpsText.visible = false;

    // Bind handlers once and keep references for removal on shutdown
    this._onScore = (v) => this.scoreText.setText('SCORE: ' + v);
    this._onHi = (v) => this.hiScoreText.setText('HI SCORE: ' + v);
    this._onWave = (v) => this.waveText.setText('WAVE : ' + v);
    this._onLives = (v) => this.livesText.setText('LIVES: ' + v);
    this._onWaveStart = (num) => {
      const banner = this.add
        .bitmapText(400, 300, 'arcade', 'WAVE ' + num, 24)
        .setTint(0xffff00)
        .setOrigin(0.5)
        .setDepth(1001);
      this.tweens.add({
        targets: banner,
        scale: 1.4,
        duration: 300,
        yoyo: true,
        onComplete: () => banner.destroy(),
      });
    };
    this._onMute = (muted) => {
      try {
        this.muteText.setText('M Sound: ' + (muted ? 'Off' : 'On'));
      } catch (e) { console.warn('Error updating mute text:', e); }
    };

    this.game.events.on('hud:score', this._onScore);
    this.game.events.on('hud:hiscore', this._onHi);
    this.game.events.on('hud:wave', this._onWave);
    this.game.events.on('hud:lives', this._onLives);
    this.game.events.on('wave:start', this._onWaveStart);
    this.game.events.on('hud:mute', this._onMute);

    // Debug-only FPS toggle on D
    if (state.debug) {
      const DKey = this.input.keyboard.addKey('D');
      this._onToggleFps = () => {
        this.fpsText.visible = !this.fpsText.visible;
      };
      DKey.on('down', this._onToggleFps);
      // Update FPS every 500ms when visible
      this._fpsTimer = this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          if (this.fpsText.visible) {
            const fps = Math.round(this.game.loop.actualFps);
            this.fpsText.setText('FPS: ' + fps);
          }
        },
      });
    }

    // Initialize mute indicator from current sound state
    try {
      this._onMute(this.sound.mute);
    } catch (e) { console.warn('Error initializing mute indicator:', e); }

    // Clean up listeners to prevent leaks when scene shuts down
    this.events.once('shutdown', () => {
      this.game.events.off('hud:score', this._onScore);
      this.game.events.off('hud:hiscore', this._onHi);
      this.game.events.off('hud:wave', this._onWave);
      this.game.events.off('hud:lives', this._onLives);
      this.game.events.off('wave:start', this._onWaveStart);
      this.game.events.off('hud:mute', this._onMute);
      try {
        this._fpsTimer?.remove?.();
      } catch (e) { console.warn('Error removing FPS timer on UIScene shutdown:', e); }
      try {
        this.input.keyboard.removeAllListeners();
      } catch (e) { console.warn('Error removing keyboard listeners on UIScene shutdown:', e); }
    });
  }

  createMobileControls() {
    // Only show on touch devices
    if (!this.sys.game.device.input.touch) return;

    const mainScene = this.scene.get('SceneB');

    // Left Button
    this.leftBtn = this.add.circle(
      MOBILE_BUTTON_MARGIN + MOBILE_BUTTON_SIZE / 2,
      HEIGHT - MOBILE_BUTTON_MARGIN - MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_COLOR,
      MOBILE_BUTTON_OPACITY,
    ).setInteractive();

    this.leftBtn.on('pointerdown', () => mainScene.controls.setTouchLeft(true));
    this.leftBtn.on('pointerup', () => mainScene.controls.setTouchLeft(false));
    this.leftBtn.on('pointerout', () => mainScene.controls.setTouchLeft(false));

    // Right Button
    this.rightBtn = this.add.circle(
      MOBILE_BUTTON_MARGIN * 2 + MOBILE_BUTTON_SIZE * 1.5,
      HEIGHT - MOBILE_BUTTON_MARGIN - MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_COLOR,
      MOBILE_BUTTON_OPACITY,
    ).setInteractive();

    this.rightBtn.on('pointerdown', () => mainScene.controls.setTouchRight(true));
    this.rightBtn.on('pointerup', () => mainScene.controls.setTouchRight(false));
    this.rightBtn.on('pointerout', () => mainScene.controls.setTouchRight(false));

    // Jump Button
    this.jumpBtn = this.add.circle(
      WIDTH - MOBILE_BUTTON_MARGIN - MOBILE_BUTTON_SIZE / 2,
      HEIGHT - MOBILE_BUTTON_MARGIN - MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_SIZE / 2,
      MOBILE_BUTTON_COLOR,
      MOBILE_BUTTON_OPACITY,
    ).setInteractive();

    this.jumpBtn.on('pointerdown', () => {
      if (state.player && state.player.body.touching.down) {
        mainScene.controls.setTouchJump(true);
      }
    });

    // Add labels
    this.add.bitmapText(this.leftBtn.x, this.leftBtn.y, 'arcade', '<', 30).setOrigin(0.5);
    this.add.bitmapText(this.rightBtn.x, this.rightBtn.y, 'arcade', '>', 30).setOrigin(0.5);
    this.add.bitmapText(this.jumpBtn.x, this.jumpBtn.y, 'arcade', '^', 30).setOrigin(0.5);
  }
}
