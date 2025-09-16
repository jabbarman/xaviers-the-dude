// Helper to setup a fullscreen toggle button and 'F' key binding.
// Reuse in scenes to avoid duplication.

import { WIDTH } from '../config.js';

/**
 * Adds a fullscreen toggle button at the top-right and binds the 'F' key.
 * Returns the created button GameObject.
 * @param {Phaser.Scene} scene
 */
export function setupFullscreen(scene) {
  const button = scene.add.image(WIDTH - 16, 16, 'fullscreen', 0).setOrigin(1, 0).setInteractive({ useHandCursor: true });
  // Increase tap target slightly for mobile UX
  button.setScale(1.25);

  const toggle = () => {
    if (scene.scale.isFullscreen) {
      button.setFrame(0);
      scene.scale.stopFullscreen();
    } else {
      button.setFrame(1);
      scene.scale.startFullscreen();
    }
  };

  button.on('pointerup', toggle);
  const FKey = scene.input.keyboard.addKey('F');
  FKey.on('down', toggle);

  // Tooltip hint
  const hint = scene.add.bitmapText(WIDTH - 84, 18, 'arcade', 'F FULLSCREEN', 12).setTint(0xcccccc).setDepth(1000);
  hint.setScrollFactor(0);

  scene.events.once('shutdown', () => {
    try { button.removeAllListeners(); } catch (e) {}
    try { FKey.removeAllListeners(); } catch (e) {}
    try { hint.destroy(); } catch (e) {}
  });

  return button;
}
