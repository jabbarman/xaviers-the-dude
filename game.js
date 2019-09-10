
const width = 800;
const height = 600;
const starsPerWave = 0; // NB the actual no will be 1 more as it creates the 1st one and then repeats by this value

let lives = 1;
let score = 0;
let hiScore = 100;
let wave = 1;
let portalJump = false;
let gameOver = false;
let player;
let stars;
let bombs;
let platforms;
let cursors;
let scoreText;
let hiScoreText;
let waveText;
let livesText;
let gameOverText;
let music;


let config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    physics: { default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
        }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
};

let game = new Phaser.Game(config);

function preload()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.audio('boden', ['assets/audio/bodenstaendig_2000_in_rock_4bit.mp3', 'assets/audio/bodenstaendig_2000_in_rock_4bit.ogg']);
    this.load.audio('tommy', 'assets/audio/tommy_in_goa.mp3');
    this.load.audio('gameOver', 'assets/audio/SoundEffects/player_death.wav');
    this.load.audio('ping', 'assets/audio/SoundEffects/p-ping.mp3');
    this.load.audio('explode', 'assets/audio/SoundEffects/explosion.mp3');
    this.load.audio('bounce', 'assets/audio/SoundEffects/mario-jumping-sound.mp3');
    this.load.audio('portalJump', 'assets/audio/SoundEffects/pickup.wav')
}

function create()
{
    // play the music meastro!
    music = this.sound.add('boden');
    music.play();
    this.sound.add('gameOver');
    this.sound.add('ping');
    this.sound.add('explode');
    this.sound.add('portalJump');

    //  A simple background for our game
    this.add.image(width/2, height/2, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect evenly spaced apart along the x axis
    let stepX = Math.floor(width/(starsPerWave+1))
    stars = this.physics.add.group({
        key: 'star',
        repeat: starsPerWave,
        setXY: { x: 12, y: 0, stepX: stepX }
    });

    stars.children.iterate(function (child) {
        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    //  The score
    hiScoreText = this.add.text(280, 10, 'Hi Score: '+score, { fontSize: '32px', fill: '#000' });
    let textBlockPositionX = 695;
    let textBlockOffsetY = 12;
    livesText = this.add.text(textBlockPositionX, textBlockOffsetY, 'lives: '+lives, { fontSize: '14px', fill: '#000' });
    waveText = this.add.text(textBlockPositionX, textBlockOffsetY*2, 'wave : '+wave, { fontSize: '14px', fill: '#000' });
    scoreText = this.add.text(textBlockPositionX, textBlockOffsetY*3, 'score: '+score, { fontSize: '14px', fill: '#000' });

    // set up game over text (and set it's visibility to false until needed
    this.gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#000' });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.visible = false;

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms, bounce, null, this);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);
    //  Collision checking the player with bombs!
    this.physics.add.collider(player, bombs, hitBomb, null, this);

}

function update()
{
    if (gameOver) {
        music.stop();
        // show game over text
        this.gameOverText.visible = true;
        return;
        this.scene.restart();
        this.physics.resume();
        gameOver = false;
    }

    if (portalJump) {
        lives = lives + 1;
        livesText.setText('lives: ' + lives);
        if (bombs.countActive(true) > 0) {
            bombs.children.iterate(function (child) {
                child.disableBody(true, true);
            });
        }
        bombs = this.physics.add.group();
        this.physics.add.collider(bombs, platforms, bounce, null, this);
        this.physics.add.collider(player, bombs, hitBomb, null, this);

        music.stop();
        music = this.sound.add('tommy');
        music.play();

        portalJump = false;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star)
{
    this.sound.play('ping');
    star.disableBody(true, true);

    //  Add and update the score
    score += 10 * wave;
    scoreText.setText('score: ' + score);

    if (score > hiScore) {
        hiScoreText.setText('Hi Score: ' + score);
    }

    if (stars.countActive(true) === 0) {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

        wave += 1;
        waveText.setText('wave : ' + wave);

        if (wave % 6 === 0) {
            this.sound.play('portalJump');
            portalJump = true;
        }
    }
}

function bounce()
{
    this.sound.play('bounce');
}

function hitBomb(player, bomb)
{
    lives -= 1;
    livesText.setText('lives: ' + lives);
    this.physics.pause();
    this.sound.play('explode');
    if (lives > 0) {
        sleep(2000);
        this.physics.resume();
    } else {
        this.sound.play('gameOver');
        player.anims.play('turn');
        player.setTint(0xff0000);
        gameOver = true;
    }

    bomb.disableBody(true, true);
}

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
