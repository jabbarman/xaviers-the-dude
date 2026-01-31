import { WIDTH, HEIGHT } from '../config.js';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(WIDTH / 2 - 160, HEIGHT / 2 - 30, 320, 50);

    const { width } = this.cameras.main;
    const { height } = this.cameras.main;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff',
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      percentText.setText(`${parseInt(value * 100, 10)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 20, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      this.scene.start('SceneA');
    });

    // Fonts
    this.load.bitmapFont(
      'arcade',
      'assets/fonts/bitmap/arcade.png',
      'assets/fonts/bitmap/arcade.xml',
    );

    // Images & sprites
    this.load.image('background_image', 'assets/earthlike_spaceships.png');
    this.load.image('sky', 'assets/sky.png');
    this.load.image('starrysky', 'assets/starrysky.png');
    this.load.image('saturnsky', 'assets/saturnsky.png');
    this.load.image('asteroidfield', 'assets/asteroidfield.png');
    this.load.image('deepspace_comets', 'assets/deepspace_comets.png');
    this.load.image('intergalactic_galaxy', 'assets/intergalactic_galaxy.png');
    this.load.image('earthlike_spaceships', 'assets/earthlike_spaceships.png');
    this.load.image('alien_landscape', 'assets/alien_landscape.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('ground_space', 'assets/platform_space.png');
    this.load.image('ground_alien', 'assets/platform_alien.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('block', 'assets/input/block.png');
    this.load.image('rub', 'assets/input/rub.png');
    this.load.image('end', 'assets/input/end.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet('fullscreen', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Audio
    this.load.audio(
      'boden',
      'assets/audio/bodenstaendig_2000_in_rock_4bit.mp3',
    );
    this.load.audio('tommy', 'assets/audio/tommy_in_goa.mp3');
    this.load.audio(
      'iLoveMy8bit',
      'assets/audio/i-love-my-8-bit-game-console-301272.mp3',
    );
    this.load.audio(
      '8BitMusic',
      'assets/audio/8-bit-music-no-copyright-background-instrumental-pixel-party-322342.mp3',
    );
    this.load.audio(
      'flat8bit',
      'assets/audio/flat-8-bit-gaming-music-instrumental-211547.mp3',
    );
    this.load.audio(
      '8bitTheme',
      'assets/audio/8bit-theme-loop-chiptune-symphony-387749.mp3',
    );
    this.load.audio(
      'percussiveDubstep',
      'assets/audio/percussive-dubstep-chiptune-218126.mp3',
    );
    this.load.audio('pixelParadise', 'assets/audio/pixel-paradise-358340.mp3');
    this.load.audio('gameOver', 'assets/audio/SoundEffects/player_death.wav');
    this.load.audio('ping', 'assets/audio/SoundEffects/p-ping.mp3');
    this.load.audio('explode', 'assets/audio/SoundEffects/explosion.mp3');
    this.load.audio(
      'bounce',
      'assets/audio/SoundEffects/mario-jumping-sound.mp3',
    );
    this.load.audio('portalJump', 'assets/audio/SoundEffects/pickup.wav');
  }

  create() {
    //  The 'complete' event handler will start the next scene
  }
}
