export class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }

    preload() {
        // Fonts
        this.load.bitmapFont('arcade', 'assets/fonts/bitmap/arcade.png', 'assets/fonts/bitmap/arcade.xml');

        // Images & sprites
        this.load.image('background_image', 'assets/sky.png');
        this.load.image('sky', 'assets/sky.png');
        this.load.image('starrysky', 'assets/starrysky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.image('block', 'assets/input/block.png');
        this.load.image('rub', 'assets/input/rub.png');
        this.load.image('end', 'assets/input/end.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('fullscreen', 'assets/fullscreen.png', { frameWidth: 64, frameHeight: 64 });

        // Audio
        this.load.audio('boden', ['assets/audio/bodenstaendig_2000_in_rock_4bit.mp3', 'assets/audio/bodenstaendig_2000_in_rock_4bit.ogg']);
        this.load.audio('tommy', 'assets/audio/tommy_in_goa.mp3');
        this.load.audio('gameOver', 'assets/audio/SoundEffects/player_death.wav');
        this.load.audio('ping', 'assets/audio/SoundEffects/p-ping.mp3');
        this.load.audio('explode', 'assets/audio/SoundEffects/explosion.mp3');
        this.load.audio('bounce', 'assets/audio/SoundEffects/mario-jumping-sound.mp3');
        this.load.audio('portalJump', 'assets/audio/SoundEffects/pickup.wav');
    }

    create() {
        this.scene.start('SceneA');
    }
}
