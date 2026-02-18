import {
  WIDTH,
  PLAYER_BOUNCE,
  STARS_BOUNCE_MIN,
  STARS_BOUNCE_MAX,
  MOVING_PLATFORM,
} from '../config.js';
import { state } from '../state.js';
import { generatePlatformLayout } from './platformLayout.js';
import { movingPlatformVelocity } from './movingPlatform.js';

export class Spawner {
  constructor(scene) {
    this.scene = scene;
  }

  spawnPlatforms(groundKey, variantIndex) {
    const platforms = this.scene.physics.add.staticGroup();
    const movingPlatforms = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    const layout = generatePlatformLayout(variantIndex, state.layoutSeed);

    const configuredMoving = Array.isArray(MOVING_PLATFORM.movingPlatformIndexes)
      ? MOVING_PLATFORM.movingPlatformIndexes
      : [MOVING_PLATFORM.movingPlatformIndex];
    const movingSet = new Set(configuredMoving.filter((i) => Number.isInteger(i)));
    const baseVelocity = movingPlatformVelocity(state.layoutSeed, variantIndex);

    layout.platforms.forEach((platform, index) => {
      if (MOVING_PLATFORM.enabled && movingSet.has(index)) {
        const sprite = movingPlatforms.create(platform.x, platform.y, groundKey);
        if (platform.scaleX && platform.scaleX !== 1) {
          sprite.setScale(platform.scaleX, 1);
        }
        sprite.refreshBody();
        sprite.body.allowGravity = false;
        sprite.body.immovable = true;
        sprite.body.moves = false;
        const ordered = [...movingSet].sort((a, b) => a - b);
        const movingOrder = ordered.indexOf(index);
        const direction = movingOrder % 2 === 0 ? 1 : -1;

        sprite.movingSpec = {
          mode: MOVING_PLATFORM.mode,
          velocityX: baseVelocity * direction,
          width: platform.width * (platform.scaleX || 1),
          wrapBuffer: MOVING_PLATFORM.wrapBuffer,
        };
        return;
      }

      const sprite = platforms.create(platform.x, platform.y, groundKey);
      if (platform.scaleX && platform.scaleX !== 1) {
        sprite.setScale(platform.scaleX, 1).refreshBody();
      }
    });

    return { platforms, movingPlatforms, layout };
  }

  spawnPlayer() {
    const player = this.scene.physics.add.sprite(100, 450, 'dude');
    player.setBounce(PLAYER_BOUNCE);
    player.setCollideWorldBounds(true);

    if (!this.scene.anims.exists('left')) {
      this.scene.anims.create({
        key: 'left',
        frames: this.scene.anims.generateFrameNumbers('dude', {
          start: 0,
          end: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.scene.anims.exists('turn')) {
      this.scene.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20,
      });
    }
    if (!this.scene.anims.exists('right')) {
      this.scene.anims.create({
        key: 'right',
        frames: this.scene.anims.generateFrameNumbers('dude', {
          start: 5,
          end: 8,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    return player;
  }

  spawnStars(starsPerWave) {
    const stepX = Math.floor(WIDTH / (starsPerWave + 1));
    const stars = this.scene.physics.add.group({
      key: 'star',
      repeat: starsPerWave,
      setXY: { x: 12, y: 0, stepX },
    });

    stars.children.iterate(function (child) {
      child.setBounceY(
        Phaser.Math.FloatBetween(STARS_BOUNCE_MIN, STARS_BOUNCE_MAX),
      );
    });

    return stars;
  }

  spawnBombs() {
    return this.scene.physics.add.group();
  }
}
