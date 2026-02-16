/**
 * Core game logic helpers.
 * These functions rely on being bound to a Phaser.Scene as `this` when used as callbacks
 * and operate on the shared mutable `state` module.
 */

import { state } from './state.js';
import {
  STAR_SCORE_BASE,
  BOMB_VELOCITY_MIN,
  BOMB_VELOCITY_MAX,
  BOMB_INITIAL_VY,
  PORTAL_WAVE_INTERVAL,
  EXTRA_BOMB_WAVE_BEFORE_PORTAL,
} from './config.js';
import { setString } from './persistence.js';

export function collectStar(player, star) {
  if (!this || !state) return;
  if (!star) return;
  try {
    this.sound.play('ping', { volume: 0.25 });
  } catch (e) { console.warn('Error playing ping sound:', e); }

  // Tiny retro pickup pop (purely cosmetic)
  try {
    const pop = this.add.image(star.x, star.y, 'star').setDepth(950);
    pop.setScale(star.scaleX || 1, star.scaleY || 1);
    this.tweens.add({
      targets: pop,
      scaleX: (star.scaleX || 1) * 1.7,
      scaleY: (star.scaleY || 1) * 1.7,
      alpha: 0,
      duration: 90,
      ease: 'Quad.Out',
      onComplete: () => pop.destroy(),
    });
  } catch (e) {
    console.warn('Error showing star pickup pop effect:', e);
  }

  try {
    star.disableBody?.(true, true);
  } catch (e) { console.warn('Error disabling star body:', e); }

  // Add and update the score
  state.score += STAR_SCORE_BASE * state.wave;
  try {
    this.game.events.emit('hud:score', state.score);
  } catch (e) { console.warn('Error emitting hud:score event:', e); }

  if (state.score > state.hiScore) {
    state.hiScore = state.score;
    try {
      this.game.events.emit('hud:hiscore', state.hiScore);
    } catch (e) { console.warn('Error emitting hud:hiscore event:', e); }
    try {
      // Persist hiScore via safe helper
      setString('hiScore', String(state.hiScore));
    } catch (e) { console.warn('Error setting hiScore in persistence:', e); }
  }

  if (state.stars?.countActive?.(true) === 0) {
    // A new batch of stars to collect
    try {
      state.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });
    } catch (e) { console.warn('Error iterating stars children:', e); }

    const px = player?.x ?? 400;
    let x =
      px < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    let bomb = state.bombs?.create?.(x, 16, 'bomb');
    if (bomb) {
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(
        Phaser.Math.Between(BOMB_VELOCITY_MIN, BOMB_VELOCITY_MAX),
        BOMB_INITIAL_VY,
      );
      bomb.allowGravity = false;
    }

    state.wave += 1;
    try {
      this.game.events.emit('hud:wave', state.wave);
    } catch (e) { console.warn('Error emitting hud:wave event:', e); }
    try {
      this.game.events.emit('wave:start', state.wave);
    } catch (e) { console.warn('Error emitting wave:start event:', e); }

    // Extra bomb just before the portal jump
    if (
      (state.wave + EXTRA_BOMB_WAVE_BEFORE_PORTAL) % PORTAL_WAVE_INTERVAL ===
      0
    ) {
      const pxx = player?.x ?? 400;
      let xb =
        pxx < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
      let bonusBomb = state.bombs?.create?.(xb, 16, 'bomb');
      if (bonusBomb) {
        bonusBomb.setBounce(1);
        bonusBomb.setCollideWorldBounds(true);
        bonusBomb.setVelocity(
          Phaser.Math.Between(BOMB_VELOCITY_MIN, BOMB_VELOCITY_MAX),
          BOMB_INITIAL_VY,
        );
        bonusBomb.allowGravity = false;
      }
    }

    if (state.wave % PORTAL_WAVE_INTERVAL === 0) {
      try {
        this.sound.play('portalJump');
      } catch (e) { console.warn('Error playing portalJump sound:', e); }
      state.portalJump = true;
    }
  }
}

export function bounce() {
  try {
    this.sound.play('bounce');
  } catch (e) { console.warn('Error playing bounce sound:', e); }
}

export async function hitBomb(player, bomb) {
  if (!state) return;
  state.lives -= 1;
  try {
    this.game.events.emit('hud:lives', state.lives);
  } catch (e) { console.warn('Error emitting hud:lives event:', e); }
  try {
    this.physics.pause();
  } catch (e) { console.warn('Error pausing physics:', e); }
  try {
    this.sound.play('explode');
  } catch (e) { console.warn('Error playing explode sound:', e); }
  if (state.lives > 0) {
    await sleep(2000);
    try {
      this.physics.resume();
    } catch (e) { console.warn('Error resuming physics:', e); }
  } else {
    try {
      this.sound.play('gameOver');
    } catch (e) { console.warn('Error playing gameOver sound:', e); }
    try {
      player?.anims?.play?.('turn');
    } catch (e) { console.warn('Error playing player turn animation:', e); }
    try {
      player?.setTint?.(0xff0000);
    } catch (e) { console.warn('Error setting player tint:', e); }
    state.gameOver = true;
  }

  try {
    bomb?.disableBody?.(true, true);
  } catch (e) { console.warn('Error disabling bomb body:', e); }
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
