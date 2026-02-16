/**
 * UI text helpers to keep styling consistent across scenes.
 */
export const RETRO_PALETTE = {
  cyan: 0x00ffff,
  white: 0xffffff,
  softWhite: 0xcccccc,
  mint: 0x00ffcc,
  magenta: 0xff00ff,
  lime: 0x00ff00,
  yellow: 0xffff00,
  amber: 0xffa500,
  orange: 0xff8200,
  red: 0xff0000,
  azure: 0x00bfff,
  panelBg: 0x02040a,
  panelEdge: 0x1a3a4f,
};

export const UI = {
  titleSize: 32,
  bigSize: 24,
  hudSize: 16,
  titleTint: RETRO_PALETTE.cyan,
  hudTint: RETRO_PALETTE.white,
};

export function addTitle(scene, x, y, text) {
  return scene.add
    .bitmapText(x, y, 'arcade', text, UI.titleSize)
    .setTint(UI.titleTint)
    .setScrollFactor(0)
    .setDepth(1000);
}

export function addBig(scene, x, y, text) {
  return scene.add
    .bitmapText(x, y, 'arcade', text, UI.bigSize)
    .setTint(UI.titleTint)
    .setScrollFactor(0)
    .setDepth(1000);
}

export function addHud(scene, x, y, text) {
  return scene.add
    .bitmapText(x, y, 'arcade', text, UI.hudSize)
    .setTint(UI.hudTint)
    .setScrollFactor(0)
    .setDepth(1000);
}

export function addHudBacking(scene, width, height = 76) {
  const strip = scene.add
    .rectangle(0, 0, width, height, RETRO_PALETTE.panelBg, 0.55)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(998);

  const edge = scene.add
    .rectangle(0, height - 2, width, 2, RETRO_PALETTE.panelEdge, 0.8)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(999);

  return { strip, edge };
}
