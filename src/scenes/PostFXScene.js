// src/scenes/PostFXScene.js
export class PostFXScene extends Phaser.Scene {
    constructor(){ super('PostFXScene'); this.on = false; }

    async create(){
        const renderer = this.game.renderer;
        if (!renderer || !renderer.pipelines) return;

        // Register CRT pipeline once under key 'crt'
        if (!renderer.pipelines.has('crt')) {
            const { CRTPipeline } = await import('../crtPipeline.js');
            renderer.pipelines.add('crt', new CRTPipeline(this.game));
        }

        // Toggle key (R)
        this.input.keyboard.on('keydown-R', () => {
            this.on = !this.on;

            // IMPORTANT: target the main gameplay scene's camera
            const mainScene = this.scene.get('SceneB'); // <— change if your gameplay scene key differs
            const cam = mainScene?.cameras?.main;
            if (!cam) return;

            if (this.on) {
                if (typeof cam.setRenderToTexture === 'function') {
                    cam.setRenderToTexture('crt');     // Phaser 3.90+ path
                } else if (typeof cam.setPostPipeline === 'function') {
                    cam.setPostPipeline('crt');        // fallback
                }
            } else {
                if (typeof cam.setRenderToTexture === 'function') {
                    cam.setRenderToTexture(null);      // clear
                } else if (typeof cam.removePostPipeline === 'function') {
                    cam.removePostPipeline('crt');     // fallback clear
                }
            }
        });

        const hint = this.add.text(10, 580, 'R: CRT/Scanline Toggle', { font: '12px monospace', fill: '#888' });
        hint.setScrollFactor(0).setDepth(2000);
    }

    update(time){
        if (!this.on) return;
        // Drive the time uniform on the global CRT pipeline
        const pipe = this.game.renderer?.pipelines?.get('crt');
        if (pipe && typeof pipe.setFloat1 === 'function') {
            pipe.setFloat1('time', time / 1000);
        }
    }
}
