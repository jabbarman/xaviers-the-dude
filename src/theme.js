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

export function addCrtOverlay(scene, width, height, options = {}) {
  const {
    enabled = true,
    scanlineAlpha = 0.12,
    vignetteAlpha = 0.22,
    depth = 970,
  } = options;

  if (!enabled) return null;

  const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth);

  // Scanlines
  const scanlines = scene.add.graphics();
  scanlines.fillStyle(0x000000, scanlineAlpha);
  for (let y = 0; y < height; y += 4) {
    scanlines.fillRect(0, y, width, 2);
  }

  // Feathered vignette: layered bands for a soft gradient on all sides
  const vignette = scene.add.graphics();
  const edgeX = Math.max(28, Math.round(width * 0.09));
  const edgeY = Math.max(22, Math.round(height * 0.07));
  const bands = 12;

  for (let i = 0; i < bands; i += 1) {
    const t = (i + 1) / bands;
    // Stronger at outer edge, smoothly falling toward center
    const falloff = Math.pow(1 - t, 1.5);

    const bandW = Math.max(1, Math.round(edgeX / bands));
    const bandH = Math.max(1, Math.round(edgeY / bands));

    // Slightly lighter on top/bottom to preserve HUD readability
    const alphaSide = vignetteAlpha * falloff;
    const alphaTopBottom = vignetteAlpha * 0.75 * falloff;

    // Left / right bands
    const xInset = i * bandW;
    vignette.fillStyle(0x000000, alphaSide);
    vignette.fillRect(xInset, 0, bandW, height);
    vignette.fillRect(width - xInset - bandW, 0, bandW, height);

    // Top / bottom bands
    const yInset = i * bandH;
    vignette.fillStyle(0x000000, alphaTopBottom);
    vignette.fillRect(0, yInset, width, bandH);
    vignette.fillRect(0, height - yInset - bandH, width, bandH);
  }

  overlay.add([scanlines, vignette]);
  return overlay;
}
