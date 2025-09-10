// Animated portal transition scene
// Launched on top of SceneB when wave 5,10,... is completed and player is alive.
// After a short animation, it restarts SceneB with a new variantIndex to create a new "world" without duplicating SceneB code.

export class PortalScene extends Phaser.Scene {
  constructor() { super('PortalScene'); }

  init(data){
    this.from = data?.from || 'SceneB';
    this.to = data?.to || 'SceneB';
    this.variantIndex = data?.variantIndex ?? 1;
  }

  create(){
    // Overlay a semi-transparent vignette and a central portal effect
    const { width, height } = this.scale;

    // Dim background
    const fade = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setDepth(5000);

    // Central swirl built from circles
    const portal = this.add.circle(width/2, height/2, 10, 0x66ccff, 0.9).setDepth(5001);
    const ring1 = this.add.circle(width/2, height/2, 30, 0x33aaff, 0.6).setStrokeStyle(2, 0xffffff, 0.8).setDepth(5001);
    const ring2 = this.add.circle(width/2, height/2, 60, 0x1188ff, 0.3).setStrokeStyle(2, 0xffffff, 0.5).setDepth(5001);

    // Text banner
    const text = this.add.bitmapText(width/2, height/2 - 100, 'arcade', 'PORTAL JUMP!', 24)
      .setOrigin(0.5).setTint(0x00ffff).setDepth(5002);

    // Sound
    this.sound.play('portalJump');

    // Camera effects
    const cam = this.cameras.main;
    cam.flash(500, 0, 128, 255);
    cam.shake(400, 0.002);

    // Animate rings and zoom
    this.tweens.add({ targets: [ring1], angle: 360, duration: 1200, repeat: -1 });
    this.tweens.add({ targets: [ring2], angle: -360, duration: 1400, repeat: -1 });
    this.tweens.add({ targets: [portal], scale: 6, alpha: 0.2, duration: 1200, yoyo: false });
    this.tweens.add({ targets: [text], y: height/2 - 130, duration: 300, yoyo: true });

    // After a short delay, perform the scene switch
    this.time.delayedCall(1300, () => {
      // Stop the source scene and start destination with variant data
      try { this.scene.stop(this.from); } catch(e) {}
      this.scene.start(this.to, { variantIndex: this.variantIndex });
      // Remove portal scene
      this.scene.stop();
    });
  }
}
