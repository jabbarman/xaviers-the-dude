// Core game logic functions extracted from the monolithic file,
// reworked to use the shared state object. These functions rely on
// being bound to a Phaser.Scene as `this` when used as callbacks.

import { state } from './state.js';

export function collectStar(player, star) {
  this.sound.play('ping');
  star.disableBody(true, true);

  // Add and update the score
  state.score += 10 * state.wave;
  this.game.events.emit('hud:score', state.score);

  if (state.score > state.hiScore) {
    state.hiScore = state.score;
    this.game.events.emit('hud:hiscore', state.hiScore);
    try {
      localStorage.setItem('hiScore', state.hiScore);
    } catch (e) {}
  }

  if (state.stars.countActive(true) === 0) {
    // A new batch of stars to collect
    state.stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    let bomb = state.bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;

    state.wave += 1;
    this.game.events.emit('hud:wave', state.wave);
    this.game.events.emit('wave:start', state.wave);

    // Extra bomb just before the portal jump
    if ((state.wave + 1) % 5 === 0) {
      let xb = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
      let bonusBomb = state.bombs.create(xb, 16, 'bomb');
      bonusBomb.setBounce(1);
      bonusBomb.setCollideWorldBounds(true);
      bonusBomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bonusBomb.allowGravity = false;
    }

    if (state.wave % 5 === 0) {
      this.sound.play('portalJump');
      state.portalJump = true;
    }
  }
}

export function bounce() {
  this.sound.play('bounce');
}

export async function hitBomb(player, bomb) {
  state.lives -= 1;
  this.game.events.emit('hud:lives', state.lives);
  this.physics.pause();
  this.sound.play('explode');
  if (state.lives > 0) {
    await sleep(2000);
    this.physics.resume();
  } else {
    this.sound.play('gameOver');
    player.anims.play('turn');
    player.setTint(0xff0000);
    state.gameOver = true;
  }

  bomb.disableBody(true, true);
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
