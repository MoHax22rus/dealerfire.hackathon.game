import 'phaser';

export default class FailScene extends Phaser.Scene {
    constructor() {
        super('Fail');
    }

    create() {
        this.view = new View(this);

        this.children.add(this.view);

        this._sound = this.sound.add('fail');
        this._sound.play();

        this.input.keyboard.on('keyup', this.keyup, this);
    }

    keyup(e) {
        if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
            this._sound.destroy();
            this.view.destroy();

            this._sound = this.view = null;

            this.input.keyboard.off('keyup', this.keyup, this);

            this.events.emit('onSceneEvent', 'gameRetry');
        }
    }

    update() {
        if (this.view) {
            this.view.update();
        }
    }
}

class View extends Phaser.GameObjects.Container {
    constructor() {
        super(...arguments);

        const bg = new Phaser.GameObjects.Graphics(this.scene, 0, 0);
        bg.fillStyle(0xf8f0e5, 1);
        bg.fillRect(
            0, 0,
            this.scene.game.config.width, this.scene.game.config.height
        );
        this.add(bg);

        this.scene.anims.create({
            key: 'sleep',
            frames: [{
                key: 'sleeping',
                frame: 'sleeping_1',
                duration: 5
            }, {
                key: 'sleeping',
                frame: 'sleeping_2',
                duration: 5
            }, {
                key: 'sleeping',
                frame: 'sleeping_3',
                duration: 5
            }],
            frameRate: 1,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'stink',
            frames: [{
                key: 'trash',
                frame: 'trash_1',
                duration: 500
            }, {
                key: 'trash',
                frame: 'trash_2',
                duration: 500
            }],
            frameRate: 5,
            repeat: -1
        });

        let trashCan = this.scene.add.sprite(0, 0).setOrigin(0, 0);
        let manager = this.scene.add.sprite(0, 0).setOrigin(0, 0);

        trashCan.anims.play('stink');
        manager.anims.play('sleep');

        trashCan.setAlpha(0);

        this.trashCan = trashCan;

        const enter = new Phaser.GameObjects.Text(
            this.scene,
            0, 0,
            'Press Enter to continue',
            {
                fontSize: 20,
                fill: '#bbb'
            }
        );
        enter.setOrigin(0.5);
        enter.setPosition(
            this.scene.game.config.width >> 1,
            this.scene.game.config.height - enter.height - 40
        );

        this.add(trashCan);
        this.add(manager);
        this.add(enter);
    }

    update() {
        if (this.trashCan.alpha < 1) {
            this.trashCan.setAlpha(this.trashCan.alpha + 0.002);
        }
    }
}