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
    } catch (e) { console.warn('Error applying persisted mute preference:', e); }
  }

  playForBackground(backgroundKey) {
    const trackKey = musicForBackground(backgroundKey);
    // Stop any currently playing track to avoid overlaps
    try {
      this.current?.stop?.();
    } catch (e) { console.warn('Error stopping AudioManager current track:', e); }

    const play = () => {
      this.current = this.scene.sound.add(trackKey);
      this.current.play();
      return this.current;
    };

    if (this.scene.sound.locked) {
      this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        play();
      });
    } else {
      play();
    }
  }

  setMuted(muted) {
    try {
      this.scene.sound.mute = !!muted;
      setBool('mute', !!muted); // Ensure setBool is used here
    } catch (e) { console.warn('Error setting mute status:', e); }
  }

  toggleMute() {
    const muted = !this.scene.sound.mute;
    this.setMuted(muted);
    return muted;
  }

  stop() {
    try {
      this.current?.stop?.();
    } catch (e) { console.warn('Error stopping current music track:', e); }
    this.current = null;
  }
}
