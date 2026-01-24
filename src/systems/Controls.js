import { PLAYER_SPEED_X, PLAYER_JUMP_VELOCITY } from '../config.js';

export class Controls {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    update(player, isGameOver) {
        if (isGameOver || !player || !player.body) return;

        if (this.cursors.left.isDown) {
            player.setVelocityX(-PLAYER_SPEED_X);
            player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            player.setVelocityX(PLAYER_SPEED_X);
            player.anims.play('right', true);
        } else {
            player.setVelocityX(0);
            player.anims.play('turn');
        }

        if (this.cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(PLAYER_JUMP_VELOCITY);
        }
    }
}
