import { state } from '../state.js';
import { getJSON, setJSON } from '../persistence.js';
import { fetchGlobalHighScores, submitGlobalHighScore, sanitizeInitials, normalizeScore } from '../services/highscores.js';

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
    this._submissionInProgress = false;
    this._globalBoardLoaded = false;

    // Layout constants to reduce crowding and split into panels
    const PANEL_SCALE = 0.75;
    const ABC_SCALE = 0.8;
    const PLAY_AGAIN_SCALE = 0.7;
    const leftX = 40;
    const rightX = 400;
    const headerY = 190;
    const rowStartY = 235;
    const rowSpacing = 40;

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
    var sanitizedName = '';
    var runScore = normalizeScore(state.score);

    var originalHighScores = this.loadHighScores();

    var scorePosition = -1;
    var newHighScore = false;

    for (var i = 0; i < originalHighScores.length; i++) {
      if (runScore > originalHighScores[i].score) {
        scorePosition = i;
        newHighScore = true;
        break;
      }
    }

    var displayHighScores = [...originalHighScores];
    if (newHighScore) {
      displayHighScores.splice(scorePosition, 0, { score: runScore, initials: '???' });
      displayHighScores = displayHighScores.slice(0, 5);
    }

    var input = this.add.bitmapText(120, 25, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-')
      .setLetterSpacing(18)
      .setScale(ABC_SCALE);
    input.setInteractive();

    var rub = this.add.image(input.x + 430, input.y + 148, 'rub');
    var end = this.add.image(input.x + 482, input.y + 148, 'end');

    var block = this.add.image(input.x - 10, input.y - 2, 'block').setOrigin(0);

    // Panel headers
    this.add.bitmapText(leftX, headerY - 25, 'arcade', 'LOCAL').setTint(0x00ffcc).setScale(PANEL_SCALE);
    this.add.bitmapText(rightX, headerY - 25, 'arcade', 'GLOBAL').setTint(0x00ffcc).setScale(PANEL_SCALE);
    this.add.bitmapText(leftX, headerY, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff).setScale(PANEL_SCALE);
    this.add.bitmapText(rightX, headerY, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff).setScale(PANEL_SCALE);

    // Global fallback status sits under the global header (compact)
    this._globalStatusText = this.add.bitmapText(rightX, headerY + 18, 'arcade', '').setTint(0xffa500).setScale(0.5);
    this._globalStatusText.visible = false;

    // Play Again affordance for clear navigation back to SceneA
    const playAgain = this.add.bitmapText(70, 520, 'arcade', 'PLAY AGAIN  (ENTER)').setTint(0x00ff00);
    playAgain.setScale(PLAY_AGAIN_SCALE);
    playAgain.setInteractive();
    playAgain.on('pointerup', () => {
      state.reset();
      this.scene.start('SceneA');
    });

    var colors = [0xff0000, 0xff8200, 0xffff00, 0x00ff00, 0x00bfff];
    var ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];

    // Keep references for dynamic updates (per board)
    this._boards = {
      local: { scoreTexts: [], initialsTexts: [] },
      global: { scoreTexts: [], initialsTexts: [] }
    };

    // Seed both boards (local values and global placeholders)
    for (var i = 0; i < 5; i++) {
      var yPos = rowStartY + (i * rowSpacing);
      var scoreTextLocal = this.add.bitmapText(leftX, yPos, 'arcade',
        ranks[i] + '   ' + displayHighScores[i].score.toString().padEnd(8)
      ).setTint(colors[i]).setScale(PANEL_SCALE);
      var initialsTextLocal = this.add.bitmapText(leftX + 240, yPos, 'arcade', displayHighScores[i].initials).setTint(colors[i]).setScale(PANEL_SCALE);
      this._boards.local.scoreTexts.push(scoreTextLocal);
      this._boards.local.initialsTexts.push(initialsTextLocal);

      var scoreTextGlobal = this.add.bitmapText(rightX, yPos, 'arcade',
        ranks[i] + '   ' + '---'.padEnd(8)
      ).setTint(colors[i]).setScale(PANEL_SCALE);
      var initialsTextGlobal = this.add.bitmapText(rightX + 240, yPos, 'arcade', '---').setTint(colors[i]).setScale(PANEL_SCALE);
      this._boards.global.scoreTexts.push(scoreTextGlobal);
      this._boards.global.initialsTexts.push(initialsTextGlobal);
    }

    var playerText = null;
    if (newHighScore && scorePosition !== -1) {
      playerText = this._boards.local.initialsTexts[scorePosition];
      playerText.text = name;
    }

    var scene = this;
    var finalizeAndRestart = async function () {
      if (!newHighScore || scorePosition === -1 || name.length === 0 || scene._submissionInProgress) return;
      scene._submissionInProgress = true;

      // Persist locally first
      var updatedHighScores = [...originalHighScores];
      updatedHighScores.splice(scorePosition, 0, { score: runScore, initials: sanitizedName || name });
      updatedHighScores = updatedHighScores.slice(0, 5);
      scene.saveHighScores(updatedHighScores);

      // Attempt global submission (best-effort)
      scene.setGlobalStatus('Submitting to global board...', 0x00ffff);
      try {
        await submitGlobalHighScore({ initials: sanitizedName || name, score: runScore });
        scene.setGlobalStatus('Submitted to global board!', 0x00ff00);
      } catch (e) {
        scene.setGlobalStatus('Could not submit to global board—local score saved.', 0xff0000);
      }

      state.reset();
      scene.scene.start('SceneA');
    };

    this.input.keyboard.on('keyup', (event) => {
      if (scene._submissionInProgress) return;

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
            finalizeAndRestart();
          } else if (cursor.x === 8 && cursor.y === 2 && name.length > 0) {
            name = name.substr(0, name.length - 1);
            sanitizedName = sanitizeInitials(name);
            if (playerText) { playerText.text = name; }
          } else if (name.length < 3) {
            const ch = chars[cursor.y][cursor.x];
            if (/^[A-Z]$/.test(ch)) {
              name = name.concat(ch);
              sanitizedName = sanitizeInitials(name);
              if (playerText) { playerText.text = name; }
            }
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
        sanitizedName = sanitizeInitials(name);
        if (playerText) { playerText.text = name; }
      } else if (char === '>' && name.length > 0) {
        finalizeAndRestart();
      } else if (name.length < 3) {
        if (/^[A-Z]$/.test(char)) {
          name = name.concat(char);
          sanitizedName = sanitizeInitials(name);
          if (playerText) { playerText.text = name; }
        }
      }
    }, this);

    // Kick off global leaderboard load (non-blocking)
    this.loadGlobalBoard(newHighScore, ranks, colors);
  }

  setGlobalStatus(message, tint = 0x00ffff) {
    if (!this._globalStatusText) return;
    this._globalStatusText.visible = !!message;
    this._globalStatusText.setText(message || '');
    if (tint != null) this._globalStatusText.setTint(tint);
  }

  updateBoard(entries, boardKey, ranks, colors) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const board = this._boards?.[boardKey];
    if (!board) return;
    const rows = Math.min(entries.length, board.scoreTexts.length);
    for (let i = 0; i < rows; i++) {
      const scoreText = board.scoreTexts[i];
      const initialsText = board.initialsTexts[i];
      if (!scoreText || !initialsText) continue;

      const entry = entries[i];
      scoreText.setText(ranks[i] + '   ' + entry.score.toString().padEnd(8));
      initialsText.setText(entry.initials);
      if (colors && colors[i] != null) {
        scoreText.setTint(colors[i]);
        initialsText.setTint(colors[i]);
      }
    }
  }

  async loadGlobalBoard(newHighScore, ranks, colors) {
    this.setGlobalStatus('Loading global board...', 0xffa500);
    try {
      const { entries } = await fetchGlobalHighScores();
      if (!entries || entries.length === 0) {
        this.setGlobalStatus('Global board unavailable—showing local scores.', 0xffa500);
        return;
      }

      this._globalBoardLoaded = true;
      this.setGlobalStatus('', 0xffa500); // clear

      // If no name entry is happening, switch board to global results.
      if (!newHighScore) {
        this.updateBoard(entries.slice(0, 5), 'global', ranks, colors);
      }
    } catch (e) {
      this.setGlobalStatus('Global board unavailable—showing local scores.', 0xffa500);
    }
  }
}
