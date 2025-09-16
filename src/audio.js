// Minimal AudioManager to centralize music selection and lifecycle.
// Prevents overlapping tracks and ensures proper stop on transitions.

import { musicForBackground } from './backgrounds.js';
import { getBool, setBool } from './persistence.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.current = null;
    // Apply persisted mute preference
    try {
      this.scene.sound.mute = getBool('mute', false);
    } catch (e) {}
  }

  playForBackground(backgroundKey) {
    const trackKey = musicForBackground(backgroundKey);
    // Stop any currently playing track to avoid overlaps
    try { this.current?.stop?.(); } catch (e) {}
    this.current = this.scene.sound.add(trackKey);
    this.current.play();
    return this.current;
  }

  setMuted(muted) {
    try {
      this.scene.sound.mute = !!muted;
      setBool('mute', !!muted);
    } catch (e) {}
  }

  toggleMute() {
    const muted = !this.scene.sound.mute;
    this.setMuted(muted);
    return muted;
  }

  stop() {
    try { this.current?.stop?.(); } catch (e) {}
    this.current = null;
  }
}
