import {
  WIDTH,
  PLAYER_BOUNCE,
  STARS_BOUNCE_MIN,
  STARS_BOUNCE_MAX,
} from '../config.js';
import { state } from '../state.js';
import { generatePlatformLayout } from './platformLayout.js';

export class Spawner {
  constructor(scene) {
    this.scene = scene;
  }

  spawnPlatforms(groundKey, variantIndex) {
    const platforms = this.scene.physics.add.staticGroup();
    const layout = generatePlatformLayout(variantIndex, state.layoutSeed);

    layout.platforms.forEach((platform) => {
      const sprite = platforms.create(platform.x, platform.y, groundKey);
      if (platform.scaleX && platform.scaleX !== 1) {
        sprite.setScale(platform.scaleX, 1).refreshBody();
      }
    });

    return platforms;
  }

  spawnPlayer() {
    const player = this.scene.physics.add.sprite(100, 450, 'dude');
    player.setBounce(PLAYER_BOUNCE);
    player.setCollideWorldBounds(true);

    // Animations (re-create each time as they are global to the game instance usually, but scoped to scene usage here if needed)
    // Actually Phaser anims are global, so we only need to create them once, but safer to check if they exist or just recreate if that's the pattern.
    // Existing code in SceneB creates them every time.
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
