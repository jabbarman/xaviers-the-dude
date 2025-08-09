import { state } from '../state.js';
import { addHud } from '../theme.js';

export class UIScene extends Phaser.Scene {
    constructor(){ super('UIScene'); }

    create(){
        this.hiScoreText = addHud(this, 280, 10, 'HI SCORE: ' + state.hiScore);
        this.livesText   = addHud(this, 10, 10, 'LIVES: ' + state.lives);
        this.waveText    = addHud(this, 10, 30, 'WAVE : ' + state.wave);
        this.scoreText   = addHud(this, 10, 50, 'SCORE: ' + state.score);

        this.game.events.on('hud:score',  (v)=> this.scoreText.setText('SCORE: ' + v));
        this.game.events.on('hud:hiscore',(v)=> this.hiScoreText.setText('HI SCORE: ' + v));
        this.game.events.on('hud:wave',   (v)=> this.waveText.setText('WAVE : ' + v));
        this.game.events.on('hud:lives',  (v)=> this.livesText.setText('LIVES: ' + v));

        this.game.events.on('wave:start', (num)=> {
            const banner = this.add.bitmapText(400, 300, 'arcade', 'WAVE ' + num, 24)
                .setTint(0xffff00).setOrigin(0.5).setDepth(1001);
            this.tweens.add({ targets: banner, scale: 1.4, duration: 300, yoyo: true, onComplete: () => banner.destroy() });
        });
    }
}
