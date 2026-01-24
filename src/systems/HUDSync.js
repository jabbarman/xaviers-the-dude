export class HUDSync {
    constructor(scene) {
        this.scene = scene;
    }

    initHUD(state) {
        this.scene.scene.launch('UIScene');
        this.refreshHUD(state);
        this.scene.game.events.emit('wave:start', state.wave);
    }

    refreshHUD(state) {
        this.scene.game.events.emit('hud:lives', state.lives);
        this.scene.game.events.emit('hud:score', state.score);
        this.scene.game.events.emit('hud:hiscore', state.hiScore);
        this.scene.game.events.emit('hud:wave', state.wave);
    }

    stopHUD() {
        try {
            this.scene.scene.stop('UIScene');
        } catch (e) {
            console.warn('Error stopping UIScene:', e);
        }
    }

    emitMute(muted) {
        this.scene.game.events.emit('hud:mute', muted);
    }
}
