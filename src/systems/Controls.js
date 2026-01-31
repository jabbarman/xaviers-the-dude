import { PLAYER_SPEED_X, PLAYER_JUMP_VELOCITY } from '../config.js';

export class Controls {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Touch input state
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
    }

    update(player, isGameOver) {
        if (isGameOver || !player || !player.body) return;

        const left = this.cursors.left.isDown || this.touchLeft;
        const right = this.cursors.right.isDown || this.touchRight;
        const jump = (this.cursors.up.isDown || this.touchJump) && player.body.touching.down;

        if (left) {
            player.setVelocityX(-PLAYER_SPEED_X);
            player.anims.play('left', true);
        } else if (right) {
            player.setVelocityX(PLAYER_SPEED_X);
            player.anims.play('right', true);
        } else {
            player.setVelocityX(0);
            player.anims.play('turn');
        }

        if (jump) {
            player.setVelocityY(PLAYER_JUMP_VELOCITY);
            this.touchJump = false; // Reset jump state after triggering
        }
    }

    setTouchLeft(down) { this.touchLeft = down; }
    setTouchRight(down) { this.touchRight = down; }
    setTouchJump(down) { this.touchJump = down; }
}
