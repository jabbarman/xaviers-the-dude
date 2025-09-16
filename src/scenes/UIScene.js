import { state } from '../state.js';
import { addHud } from '../theme.js';

export class UIScene extends Phaser.Scene {
    constructor(){ super('UIScene'); }

    create(){
        this.hiScoreText = addHud(this, 280, 10, 'HI SCORE: ' + state.hiScore);
        this.livesText   = addHud(this, 10, 10, 'LIVES: ' + state.lives);
        this.waveText    = addHud(this, 10, 30, 'WAVE : ' + state.wave);
        this.scoreText   = addHud(this, 10, 50, 'SCORE: ' + state.score);

        // Mute indicator (top-right)
        this.muteText = addHud(this, 640, 10, '[M] SOUND: ON');

        // Optional FPS (debug only)
        this.fpsText = addHud(this, 640, 30, 'FPS: 0');
        this.fpsText.visible = false;

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
        this._onMute = (muted) => {
            try { this.muteText.setText('[M] SOUND: ' + (muted ? 'OFF' : 'ON')); } catch (e) {}
        };

        this.game.events.on('hud:score',   this._onScore);
        this.game.events.on('hud:hiscore', this._onHi);
        this.game.events.on('hud:wave',    this._onWave);
        this.game.events.on('hud:lives',   this._onLives);
        this.game.events.on('wave:start',  this._onWaveStart);
        this.game.events.on('hud:mute',    this._onMute);

        // Debug-only FPS toggle on D
        if (state.debug) {
            const DKey = this.input.keyboard.addKey('D');
            this._onToggleFps = () => { this.fpsText.visible = !this.fpsText.visible; };
            DKey.on('down', this._onToggleFps);
            // Update FPS every 500ms when visible
            this._fpsTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => {
                if (this.fpsText.visible) {
                    const fps = Math.round(this.game.loop.actualFps);
                    this.fpsText.setText('FPS: ' + fps);
                }
            }});
        }

        // Initialize mute indicator from current sound state
        try {
            this._onMute(this.sound.mute);
        } catch (e) {}

        // Clean up listeners to prevent leaks when scene shuts down
        this.events.once('shutdown', () => {
            this.game.events.off('hud:score',   this._onScore);
            this.game.events.off('hud:hiscore', this._onHi);
            this.game.events.off('hud:wave',    this._onWave);
            this.game.events.off('hud:lives',   this._onLives);
            this.game.events.off('wave:start',  this._onWaveStart);
            this.game.events.off('hud:mute',    this._onMute);
            try { this._fpsTimer?.remove?.(); } catch (e) {}
            try { this.input.keyboard.removeAllListeners(); } catch (e) {}
        });
    }
}
