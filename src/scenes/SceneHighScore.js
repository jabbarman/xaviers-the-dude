import { state } from '../state.js';
import { getJSON, setJSON } from '../persistence.js';

export class SceneHighScore extends Phaser.Scene {
  constructor() {
    super('SceneHighScore');
  }

  loadHighScores() {
    let highScores = [];
    try {
      // Use persistence helper for safety and corruption recovery
      highScores = getJSON('highScores', []);
    } catch (e) {
      console.error('Error loading high scores:', e);
    }

    while (highScores.length < 5) {
      highScores.push({ score: 1000, initials: 'UNK' });
    }

    highScores.sort((a, b) => b.score - a.score);
    return highScores.slice(0, 5);
  }

  saveHighScores(highScores) {
    try {
      setJSON('highScores', highScores);
    } catch (e) {
      console.error('Error saving high scores:', e);
    }
  }

  create() {
    // Ensure overlays are hidden/removed on the final scene
    this.scene.stop('UIScene');

    // Keys: use explicit addKeys and KeyCodes for clarity
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({
      left: KeyCodes.LEFT,
      right: KeyCodes.RIGHT,
      up: KeyCodes.UP,
      down: KeyCodes.DOWN,
      enter: KeyCodes.ENTER,
      space: KeyCodes.SPACE,
      esc: KeyCodes.ESC
    });

    var chars = [
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
      ['U', 'V', 'W', 'X', 'Y', 'Z', '.', '-', '<', '>']
    ];
    var cursor = { x: 0, y: 0 };
    var name = '';

    var originalHighScores = this.loadHighScores();

    var scorePosition = -1;
    var newHighScore = false;

    for (var i = 0; i < originalHighScores.length; i++) {
      if (state.score > originalHighScores[i].score) {
        scorePosition = i;
        newHighScore = true;
        break;
      }
    }

    var displayHighScores = [...originalHighScores];
    if (newHighScore) {
      displayHighScores.splice(scorePosition, 0, { score: state.score, initials: '???' });
      displayHighScores = displayHighScores.slice(0, 5);
    }

    var input = this.add.bitmapText(130, 35, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-').setLetterSpacing(20);
    input.setInteractive();

    var rub = this.add.image(input.x + 430, input.y + 148, 'rub');
    var end = this.add.image(input.x + 482, input.y + 148, 'end');

    var block = this.add.image(input.x - 10, input.y - 2, 'block').setOrigin(0);

    var legend = this.add.bitmapText(80, 235, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff);

    // Play Again affordance for clear navigation back to SceneA
    const playAgain = this.add.bitmapText(70, 540, 'arcade', 'PLAY AGAIN  (ENTER)').setTint(0x00ff00);
    playAgain.setInteractive();
    playAgain.on('pointerup', () => {
      state.reset();
      this.scene.start('SceneA');
    });

    var scoreTexts = [];
    var initialsTexts = [];
    var colors = [0xff0000, 0xff8200, 0xffff00, 0x00ff00, 0x00bfff];
    var ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];

    for (var i = 0; i < 5; i++) {
      var yPos = 285 + (i * 50);
      var scoreText = this.add.bitmapText(80, yPos, 'arcade',
        ranks[i] + '   ' + displayHighScores[i].score.toString().padEnd(8)
      ).setTint(colors[i]);
      scoreTexts.push(scoreText);

      var initialsText = this.add.bitmapText(560, yPos, 'arcade', displayHighScores[i].initials).setTint(colors[i]);
      initialsTexts.push(initialsText);
    }

    var playerText = null;
    if (newHighScore && scorePosition !== -1) {
      playerText = initialsTexts[scorePosition];
      playerText.text = name;
    }

    var scene = this;

    this.input.keyboard.on('keyup', (event) => {
      const kc = Phaser.Input.Keyboard.KeyCodes;
      switch (event.keyCode) {
        case kc.LEFT:
          if (cursor.x > 0) { cursor.x--; block.x -= 52; }
          break;
        case kc.RIGHT:
          if (cursor.x < 9) { cursor.x++; block.x += 52; }
          break;
        case kc.UP:
          if (cursor.y > 0) { cursor.y--; block.y -= 64; }
          break;
        case kc.DOWN:
          if (cursor.y < 2) { cursor.y++; block.y += 64; }
          break;
        case kc.ENTER:
        case kc.SPACE:
          if (!newHighScore) {
            // Allow quick restart when there is no new high score to enter
            state.reset();
            scene.scene.start('SceneA');
          } else if (cursor.x === 9 && cursor.y === 2 && name.length > 0) {
            if (newHighScore && scorePosition !== -1) {
              var updatedHighScores = [...originalHighScores];
              updatedHighScores.splice(scorePosition, 0, { score: state.score, initials: name });
              updatedHighScores = updatedHighScores.slice(0, 5);
              scene.saveHighScores(updatedHighScores);
              state.reset();
              scene.scene.start('SceneA');
            }
          } else if (cursor.x === 8 && cursor.y === 2 && name.length > 0) {
            name = name.substr(0, name.length - 1);
            if (playerText) { playerText.text = name; }
          } else if (name.length < 3) {
            name = name.concat(chars[cursor.y][cursor.x]);
            if (playerText) { playerText.text = name; }
          }
          break;
        case kc.ESC:
          // Cancel entry, go back to SceneA without saving
          state.reset();
          scene.scene.start('SceneA');
          break;
        default:
          break;
      }
    });

    input.on('pointermove', function (pointer, x, y) {
      var cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
      var cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
      var char = chars[cy][cx];
      cursor.x = cx; cursor.y = cy;
      block.x = input.x - 10 + (cx * 52);
      block.y = input.y - 2 + (cy * 64);
    }, this);

    input.on('pointerup', function (pointer, x, y) {
      var cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
      var cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
      var char = chars[cy][cx];
      cursor.x = cx; cursor.y = cy;
      block.x = input.x - 10 + (cx * 52);
      block.y = input.y - 2 + (cy * 64);

      if (char === '<' && name.length > 0) {
        name = name.substr(0, name.length - 1);
        if (playerText) { playerText.text = name; }
      } else if (char === '>' && name.length > 0) {
        if (newHighScore && scorePosition !== -1) {
          var updatedHighScores = [...originalHighScores];
          updatedHighScores.splice(scorePosition, 0, { score: state.score, initials: name });
          updatedHighScores = updatedHighScores.slice(0, 5);
          scene.saveHighScores(updatedHighScores);
          state.reset();
          scene.scene.start('SceneA');
        }
      } else if (name.length < 3) {
        name = name.concat(char);
        if (playerText) { playerText.text = name; }
      }
    }, this);
  }
}
