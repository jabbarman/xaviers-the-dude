/**
 * UI text helpers to keep styling consistent across scenes.
 */
export const UI = {
    titleSize: 32,
    bigSize: 24,
    hudSize: 16,
    titleTint: 0x00ffff,
    hudTint: 0xffffff,
};

export function addTitle(scene, x, y, text) {
    return scene
        .add.bitmapText(x, y, 'arcade', text, UI.titleSize)
        .setTint(UI.titleTint)
        .setScrollFactor(0)
        .setDepth(1000);
}

export function addBig(scene, x, y, text) {
    return scene
        .add.bitmapText(x, y, 'arcade', text, UI.bigSize)
        .setTint(UI.titleTint)
        .setScrollFactor(0)
        .setDepth(1000);
}

export function addHud(scene, x, y, text) {
    return scene
        .add.bitmapText(x, y, 'arcade', text, UI.hudSize)
        .setTint(UI.hudTint)
        .setScrollFactor(0)
        .setDepth(1000);
}
