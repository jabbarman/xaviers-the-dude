const width = 800;
const height = 600;

let debug = false;

let starsPerWave = 10; // NB the actual no will be 1 more as it creates the 1st one and then repeats by this vsalue
let lives = 3;
let score = 0;
// Load hiScore from localStorage if available, otherwise use default value
let hiScore = localStorage.getItem('hiScore') ? parseInt(localStorage.getItem('hiScore')) : 100;
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

if (debug) {
    starsPerWave = 0;
    lives = 1;
    hiScore = 0;
    localStorage.setItem('hiScore', hiScore);
}

class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }

    preload ()
    {
        this.load.image('background_image', 'assets/sky.png');
    }

    create ()
    {
        let background = this.add.sprite(0, 0, 'background_image');
        background.setOrigin(0,0);
        this.add.text(150, 230, 'The Dude', { fontSize: '100px', color: '#0000FF' });
        this.input.on('pointerup', function () {
            this.scene.start('SceneB');
        }, this);

    }
}

class SceneB extends Phaser.Scene {

    constructor() {
        super('SceneB');
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', {frameWidth: 32, frameHeight: 48});
        this.load.spritesheet('fullscreen', 'assets/fullscreen.png', { frameWidth: 64, frameHeight: 64 });
        this.load.audio('boden', ['assets/audio/bodenstaendig_2000_in_rock_4bit.mp3', 'assets/audio/bodenstaendig_2000_in_rock_4bit.ogg']);
        this.load.audio('tommy', 'assets/audio/tommy_in_goa.mp3');
        this.load.audio('gameOver', 'assets/audio/SoundEffects/player_death.wav');
        this.load.audio('ping', 'assets/audio/SoundEffects/p-ping.mp3');
        this.load.audio('explode', 'assets/audio/SoundEffects/explosion.mp3');
        this.load.audio('bounce', 'assets/audio/SoundEffects/mario-jumping-sound.mp3');
        this.load.audio('portalJump', 'assets/audio/SoundEffects/pickup.wav')
    }

    create() {
        // play the music meastro!
        music = this.sound.add('boden');
        music.play();
        this.sound.add('gameOver');
        this.sound.add('ping');
        this.sound.add('explode');
        this.sound.add('portalJump');

        //  A simple background for our game
        this.add.image(width / 2, height / 2, 'sky');

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
            frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{key: 'dude', frame: 4}],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
            frameRate: 10,
            repeat: -1
        });

        //  Input Events
        cursors = this.input.keyboard.createCursorKeys();

        //  Some stars to collect evenly spaced apart along the x axis
        let stepX = Math.floor(width / (starsPerWave + 1))
        stars = this.physics.add.group({
            key: 'star',
            repeat: starsPerWave,
            setXY: {x: 12, y: 0, stepX: stepX}
        });

        stars.children.iterate(function (child) {
            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        bombs = this.physics.add.group();

        //  The score
        hiScoreText = this.add.text(280, 10, 'Hi Score: ' + hiScore, {fontSize: '32px', fill: '#000'});
        let textBlockPositionX = 15;
        let textBlockOffsetY = 12;
        livesText = this.add.text(textBlockPositionX, textBlockOffsetY, 'lives: ' + lives, {
            fontSize: '14px',
            fill: '#000'
        });
        waveText = this.add.text(textBlockPositionX, textBlockOffsetY * 2, 'wave : ' + wave, {
            fontSize: '14px',
            fill: '#000'
        });
        scoreText = this.add.text(textBlockPositionX, textBlockOffsetY * 3, 'score: ' + score, {
            fontSize: '14px',
            fill: '#000'
        });

        // set up game over text (and set it's visibility to false until needed
        this.gameOverText = this.add.text(400, 300, 'Game Over', {fontSize: '64px', fill: '#000'});
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

        let button = this.add.image(800-16, 16, 'fullscreen', 0).setOrigin(1, 0).setInteractive();

        button.on('pointerup', function () {
            if (this.scale.isFullscreen)
            {
                button.setFrame(0);
                this.scale.stopFullscreen();
            }
            else
            {
                button.setFrame(1);
                this.scale.startFullscreen();
            }
        }, this);

        let FKey = this.input.keyboard.addKey('F');
        FKey.on('down', function () {
            if (this.scale.isFullscreen)
            {
                button.setFrame(0);
                this.scale.stopFullscreen();
            }
            else
            {
                button.setFrame(1);
                this.scale.startFullscreen();
            }
        }, this);
    }

    update(time, delta) {
        if (gameOver) {
            music.stop();
            // show game over text
            this.gameOverText.visible = true;

            this.input.on('pointerup', function () {
                this.scene.start('SceneC');
            }, this);
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
}

class SceneC extends Phaser.Scene {

    constructor ()
    {
        super('SceneC');
    }

    preload ()
    {
        this.load.image('background_image', '/assets/sky.png');
    }

    create ()
    {
        let background = this.add.sprite(0, 0, 'background_image');
        background.setOrigin(0,0);
        this.add.text(180, 200, 'The End', { fontSize: '100px', color: '#0000FF' });
        this.add.text(180, 300, 'Your Score ' + score, { fontSize: '50px', color: '#0000FF' });
        this.add.text(180, 380, 'High Score ' + hiScore, { fontSize: '50px', color: '#0000FF' });
        this.input.on('pointerup', function () {
            this.scene.start('SceneD');
        }, this);
    }
}

class SceneD extends Phaser.Scene {
    constructor ()
    {
        super('SceneD');
    }

    loadHighScores() {
        // Try to get high scores from localStorage
        let highScores = [];
        try {
            const storedScores = localStorage.getItem('highScores');
            if (storedScores) {
                highScores = JSON.parse(storedScores);
            }
        } catch (e) {
            console.error('Error loading high scores from localStorage:', e);
        }

        // Ensure we have 5 entries, fill with defaults if needed
        while (highScores.length < 5) {
            highScores.push({ score: 1000, initials: 'UNK' });
        }

        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);

        // Trim to 5 entries
        return highScores.slice(0, 5);
    }

    saveHighScores(highScores) {
        try {
            localStorage.setItem('highScores', JSON.stringify(highScores));
        } catch (e) {
            console.error('Error saving high scores to localStorage:', e);
        }
    }

    preload() {
        this.load.image('block', 'assets/input/block.png');
        this.load.image('rub', 'assets/input/rub.png');
        this.load.image('end', 'assets/input/end.png');
        this.load.bitmapFont('arcade', 'assets/fonts/bitmap/arcade.png', 'assets/fonts/bitmap/arcade.xml');
    }

    create() {
        var chars = [
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
            ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
            ['U', 'V', 'W', 'X', 'Y', 'Z', '.', '-', '<', '>']
        ];
        var cursor = {x: 0, y: 0};
        var name = '';

        // Load high scores from localStorage or use defaults
        var originalHighScores = this.loadHighScores();

        // Check if current score qualifies for high scores
        var scorePosition = -1;
        var newHighScore = false;

        for (var i = 0; i < originalHighScores.length; i++) {
            if (score > originalHighScores[i].score) {
                scorePosition = i;
                newHighScore = true;
                break;
            }
        }

        // Create a copy for display that includes the new score if it qualifies
        var displayHighScores = [...originalHighScores];
        if (newHighScore) {
            // Insert the new score into the display array
            displayHighScores.splice(scorePosition, 0, { score: score, initials: '???' });
            // Remove the lowest score to keep only 5
            displayHighScores = displayHighScores.slice(0, 5);
        }

        var input = this.add.bitmapText(130, 50, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-').setLetterSpacing(20);

        input.setInteractive();

        var rub = this.add.image(input.x + 430, input.y + 148, 'rub');
        var end = this.add.image(input.x + 482, input.y + 148, 'end');

        var block = this.add.image(input.x - 10, input.y - 2, 'block').setOrigin(0);

        var legend = this.add.bitmapText(80, 260, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff);

        // Display high scores using the display array
        var scoreTexts = [];
        var initialsTexts = [];
        var colors = [0xff0000, 0xff8200, 0xffff00, 0x00ff00, 0x00bfff];
        var ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];

        for (var i = 0; i < 5; i++) {
            var yPos = 310 + (i * 50);
            // Create the rank and score part
            var scoreText = this.add.bitmapText(80, yPos, 'arcade',
                ranks[i] + '   ' + displayHighScores[i].score.toString().padEnd(8)
            ).setTint(colors[i]);
            scoreTexts.push(scoreText);

            // Create separate text for initials
            var initialsText = this.add.bitmapText(560, yPos, 'arcade', displayHighScores[i].initials).setTint(colors[i]);
            initialsTexts.push(initialsText);
        }

        // Reference to the player's initials text if they have a new high score
        var playerText = null;
        if (newHighScore && scorePosition !== -1) {
            playerText = initialsTexts[scorePosition];
            playerText.text = name; // Start with empty name
        }

        // Store references for the input handlers
        var scene = this;

        this.input.keyboard.on('keyup', function (event) {

            if (event.keyCode === 37) {
                //  left
                if (cursor.x > 0) {
                    cursor.x--;
                    block.x -= 52;
                }
            } else if (event.keyCode === 39) {
                //  right
                if (cursor.x < 9) {
                    cursor.x++;
                    block.x += 52;
                }
            } else if (event.keyCode === 38) {
                //  up
                if (cursor.y > 0) {
                    cursor.y--;
                    block.y -= 64;
                }
            } else if (event.keyCode === 40) {
                //  down
                if (cursor.y < 2) {
                    cursor.y++;
                    block.y += 64;
                }
            } else if (event.keyCode === 13 || event.keyCode === 32) {
                //  Enter or Space
                if (cursor.x === 9 && cursor.y === 2 && name.length > 0) {
                    //  Submit
                    if (newHighScore && scorePosition !== -1) {
                        // Create new high scores array by inserting the completed entry
                        var updatedHighScores = [...originalHighScores];
                        updatedHighScores.splice(scorePosition, 0, { score: score, initials: name });
                        // Keep only top 5 scores
                        updatedHighScores = updatedHighScores.slice(0, 5);

                        // Save the updated high scores
                        scene.saveHighScores(updatedHighScores);

                        // Reset score to prevent duplicate display on restart
                        score = 0;

                        // Move to next scene or restart to show updated scores
                        scene.scene.restart();
                    }
                } else if (cursor.x === 8 && cursor.y === 2 && name.length > 0) {
                    //  Rub
                    name = name.substr(0, name.length - 1);
                    if (playerText) {
                        playerText.text = name;
                    }
                } else if (name.length < 3) {
                    //  Add
                    name = name.concat(chars[cursor.y][cursor.x]);
                    if (playerText) {
                        playerText.text = name;
                    }
                }
            }

        });

        input.on('pointermove', function (pointer, x, y) {

            var cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
            var cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
            var char = chars[cy][cx];

            cursor.x = cx;
            cursor.y = cy;

            block.x = input.x - 10 + (cx * 52);
            block.y = input.y - 2 + (cy * 64);

        }, this);

        input.on('pointerup', function (pointer, x, y) {

            var cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
            var cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
            var char = chars[cy][cx];

            cursor.x = cx;
            cursor.y = cy;

            block.x = input.x - 10 + (cx * 52);
            block.y = input.y - 2 + (cy * 64);

            if (char === '<' && name.length > 0) {
                //  Rub
                name = name.substr(0, name.length - 1);
                if (playerText) {
                    playerText.text = name;
                }
            } else if (char === '>' && name.length > 0) {
                //  Submit
                if (newHighScore && scorePosition !== -1) {
                    // Create new high scores array by inserting the completed entry
                    var updatedHighScores = [...originalHighScores];
                    updatedHighScores.splice(scorePosition, 0, { score: score, initials: name });
                    // Keep only top 5 scores
                    updatedHighScores = updatedHighScores.slice(0, 5);

                    // Save the updated high scores
                    scene.saveHighScores(updatedHighScores);

                    // Reset score to prevent duplicate display on restart
                    score = 0;

                    // Move to next scene or restart to show updated scores
                    scene.scene.restart();
                }
            } else if (name.length < 3) {
                //  Add
                name = name.concat(char);
                if (playerText) {
                    playerText.text = name;
                }
            }

        }, this);
    }
}

function collectStar(player, star) {
    this.sound.play('ping');
    star.disableBody(true, true);

    //  Add and update the score
    score += 10 * wave;
    scoreText.setText('score: ' + score);

    if (score > hiScore) {
        hiScore = score;
        hiScoreText.setText('Hi Score: ' + hiScore);
        // Save the new high score to localStorage
        localStorage.setItem('hiScore', hiScore);
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

function bounce() {
    this.sound.play('bounce');
}

async function hitBomb(player, bomb) {
    lives -= 1;
    livesText.setText('lives: ' + lives);
    this.physics.pause();
    this.sound.play('explode');
    if (lives > 0) {
        await sleep(2000);
        this.physics.resume();
    } else {
        this.sound.play('gameOver');
        player.anims.play('turn');
        player.setTint(0xff0000);
        gameOver = true;
    }

    bomb.disableBody(true, true);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-example',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: width,
        height: height
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [ SceneA, SceneB, SceneC, SceneD ]
};

let game = new Phaser.Game(config);