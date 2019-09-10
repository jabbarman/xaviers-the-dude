
import {Phaser} from "/Phaser.min.js"

class titleScene extends Phaser.scene{
    constructor() {
        super({key: 'titleScene'});

        preload()
        {
            this.load.image('background_image', '/assets/start.png');
        }

        create()
        {
            let background = this.add.sprite(0, 0, 'background_image');
            background.setOrigin(0,0);
        }
    }
}

export default titleScene;