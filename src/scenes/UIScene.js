import { state } from '../state.js';
import { addHud } from '../theme.js';

export class UIScene extends Phaser.Scene {
    constructor(){ super('UIScene'); }

    create(){
        this.hiScoreText = addHud(this, 280, 10, 'HI SCORE: ' + state.hiScore);
        this.livesText   = addHud(this, 10, 10, 'LIVES: ' + state.lives);
        this.waveText    = addHud(this, 10, 30, 'WAVE : ' + state.wave);
        this.scoreText   = addHud(this, 10, 50, 'SCORE: ' + state.score);

        // Bind handlers once and keep references for removal on shutdown
        this._onScore  = (v)=> this.scoreText.setText('SCORE: ' + v);
        this._onHi     = (v)=> this.hiScoreText.setText('HI SCORE: ' + v);
        this._onWave   = (v)=> this.waveText.setText('WAVE : ' + v);
        this._onLives  = (v)=> this.livesText.setText('LIVES: ' + v);
        this._onWaveStart = (num)=> {
            const banner = this.add.bitmapText(400, 300, 'arcade', 'WAVE ' + num, 24)
                .setTint(0xffff00).setOrigin(0.5).setDepth(1001);
            this.tweens.add({ targets: banner, scale: 1.4, duration: 300, yoyo: true, onComplete: () => banner.destroy() });
        };

        this.game.events.on('hud:score',   this._onScore);
        this.game.events.on('hud:hiscore', this._onHi);
        this.game.events.on('hud:wave',    this._onWave);
        this.game.events.on('hud:lives',   this._onLives);
        this.game.events.on('wave:start',  this._onWaveStart);

        // Clean up listeners to prevent leaks when scene shuts down
        this.events.once('shutdown', () => {
            this.game.events.off('hud:score',   this._onScore);
            this.game.events.off('hud:hiscore', this._onHi);
            this.game.events.off('hud:wave',    this._onWave);
            this.game.events.off('hud:lives',   this._onLives);
            this.game.events.off('wave:start',  this._onWaveStart);
        });
    }
}
