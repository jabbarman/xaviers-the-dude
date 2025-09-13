// Minimal AudioManager to centralize music selection and lifecycle.
// Prevents overlapping tracks and ensures proper stop on transitions.

import { musicForBackground } from './backgrounds.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.current = null;
  }

  playForBackground(backgroundKey) {
    const trackKey = musicForBackground(backgroundKey);
    // Stop any currently playing track to avoid overlaps
    try { this.current?.stop?.(); } catch (e) {}
    this.current = this.scene.sound.add(trackKey);
    this.current.play();
    return this.current;
  }

  stop() {
    try { this.current?.stop?.(); } catch (e) {}
    this.current = null;
  }
}
